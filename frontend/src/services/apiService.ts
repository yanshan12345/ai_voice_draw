/**
 * API Service - HTTP请求封装
 */

import axios, { type AxiosInstance, AxiosError } from 'axios'
import type {
  CommandRequest,
  CommandResponse,
  ImageGenerateRequest,
  ImageGenerateResponse,
  CanvasStateDTO,
  ApiErrorResponse
} from '../types'

class ApiService {
  private client: AxiosInstance
  private abortControllers = new Map<string, AbortController>()
  private debounceTimers = new Map<string, NodeJS.Timeout>()

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private cancelRequest(key: string): void {
    const controller = this.abortControllers.get(key)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(key)
    }
  }

  private createAbortSignal(key: string): AbortSignal {
    this.cancelRequest(key)
    const controller = new AbortController()
    this.abortControllers.set(key, controller)
    return controller.signal
  }

  private debounce<T>(key: string, fn: () => Promise<T>, delay: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const existingTimer = this.debounceTimers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(() => {
        this.debounceTimers.delete(key)
        fn().then(resolve).catch(reject)
      }, delay)

      this.debounceTimers.set(key, timer)
    })
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        return response
      },
      (error: AxiosError<ApiErrorResponse>) => {
        const errorMessage = error.response?.data?.message || error.message || '请求失败'
        console.error('API Error:', errorMessage)
        return Promise.reject(new Error(errorMessage))
      }
    )
  }

  /**
   * 解析语音指令（带取消机制）
   */
  async parseCommand(text: string, canvasState: CanvasStateDTO): Promise<CommandResponse> {
    const key = 'parseCommand'
    const signal = this.createAbortSignal(key)
    const request: CommandRequest = {
      text,
      canvas_state: canvasState
    }
    console.log('[ApiService] 发送parseCommand请求:', request)
    const response = await this.client.post<CommandResponse>('/command/parse', request, { signal })
    console.log('[ApiService] 收到parseCommand响应:', response.data)
    return response.data
  }

  /**
   * 生成图像（带取消机制）
   */
  async generateImage(
    prompt: string,
    canvasContext: string,
    size: string = '1024*1024'
  ): Promise<ImageGenerateResponse> {
    const key = 'generateImage'
    const signal = this.createAbortSignal(key)
    const request: ImageGenerateRequest = {
      prompt,
      canvas_context: canvasContext,
      size
    }
    // 图像生成需要更长时间，设置2分钟超时
    const response = await this.client.post<ImageGenerateResponse>('/image/generate', request, {
      signal,
      timeout: 120000
    })
    return response.data
  }
}

export default new ApiService()
