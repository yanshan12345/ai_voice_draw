export interface TTSConfig {
  lang: string
  rate: number
  pitch: number
  volume: number
}

interface QueueItem {
  text: string
  priority: 'high' | 'normal'
  resolve: () => void
  reject: (error: Error) => void
}

export class VoiceOutputModule {
  private config: TTSConfig = {
    lang: 'zh-CN',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  }
  private enabled = true
  private queue: QueueItem[] = []
  private speaking = false

  init(config: TTSConfig): void {
    this.config = { ...config }
  }

  speak(text: string, priority: 'high' | 'normal' = 'normal'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.enabled) {
        resolve()
        return
      }

      const item: QueueItem = { text, priority, resolve, reject }

      if (priority === 'high') {
        this.stop()
        this.queue.unshift(item)
      } else {
        this.queue.push(item)
      }

      this.processQueue()
    })
  }

  stop(): void {
    speechSynthesis.cancel()
    this.speaking = false
    this.queue.forEach(item => item.resolve())
    this.queue = []
  }

  pause(): void {
    speechSynthesis.pause()
  }

  resume(): void {
    speechSynthesis.resume()
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stop()
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  private processQueue(): void {
    if (this.speaking || this.queue.length === 0) return

    const item = this.queue.shift()!
    this.speaking = true

    const utterance = new SpeechSynthesisUtterance(item.text)
    utterance.lang = this.config.lang
    utterance.rate = this.config.rate
    utterance.pitch = this.config.pitch
    utterance.volume = this.config.volume

    utterance.onend = () => {
      this.speaking = false
      item.resolve()
      this.processQueue()
    }

    utterance.onerror = (event) => {
      this.speaking = false
      item.reject(new Error(event.error))
      this.processQueue()
    }

    speechSynthesis.speak(utterance)
  }
}
