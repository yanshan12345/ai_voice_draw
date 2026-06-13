interface VoiceConfig {
  lang: string
  continuous: boolean
  interimResults: boolean
}

type RecognitionState = 'idle' | 'listening' | 'recognizing'

class VoiceInputModule {
  private static instance: VoiceInputModule | null = null
  private recognition: SpeechRecognition | null = null
  private state: RecognitionState = 'idle'
  private config: VoiceConfig = {
    lang: 'zh-CN',
    continuous: false,
    interimResults: false
  }

  private callbacks = {
    onResult: (_text: string, _confidence: number) => {},
    onError: (_error: Error) => {},
    onStart: () => {},
    onEnd: () => {}
  }

  private constructor() {}

  static getInstance(): VoiceInputModule {
    if (!VoiceInputModule.instance) {
      VoiceInputModule.instance = new VoiceInputModule()
    }
    return VoiceInputModule.instance
  }

  init(config: Partial<VoiceConfig>): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      throw new Error('浏览器不支持语音识别')
    }

    this.config = { ...this.config, ...config }
    this.recognition = new SpeechRecognition()
    this.recognition.lang = this.config.lang
    this.recognition.continuous = this.config.continuous
    this.recognition.interimResults = this.config.interimResults

    this.recognition.onstart = () => {
      this.state = 'listening'
      this.callbacks.onStart()
    }

    this.recognition.onresult = (event) => {
      this.state = 'recognizing'
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript
      const confidence = result[0].confidence
      this.callbacks.onResult(transcript, confidence)
    }

    this.recognition.onerror = (event) => {
      this.callbacks.onError(new Error(event.error))
      if (this.config.continuous && event.error !== 'no-speech') {
        setTimeout(() => this.reconnect(), 1000)
      }
    }

    this.recognition.onend = () => {
      this.state = 'idle'
      this.callbacks.onEnd()
      if (this.config.continuous) {
        setTimeout(() => this.reconnect(), 100)
      }
    }
  }

  private reconnect(): void {
    if (this.state === 'idle' && this.config.continuous && this.recognition) {
      try {
        this.recognition.start()
      } catch (e) {
        // Already started
      }
    }
  }

  startContinuousListening(): void {
    if (!this.recognition) {
      throw new Error('请先调用 init() 初始化')
    }
    this.config.continuous = true
    this.recognition.continuous = true
    this.recognition.start()
  }

  stopListening(): void {
    if (this.recognition) {
      this.config.continuous = false
      this.recognition.continuous = false
      this.recognition.stop()
    }
  }

  startPushToTalk(): void {
    if (!this.recognition) {
      throw new Error('请先调用 init() 初始化')
    }
    this.recognition.continuous = false
    this.recognition.start()
  }

  stopPushToTalk(): void {
    if (this.recognition) {
      this.recognition.stop()
    }
  }

  onResult(callback: (text: string, confidence: number) => void): void {
    this.callbacks.onResult = callback
  }

  onError(callback: (error: Error) => void): void {
    this.callbacks.onError = callback
  }

  onStart(callback: () => void): void {
    this.callbacks.onStart = callback
  }

  onEnd(callback: () => void): void {
    this.callbacks.onEnd = callback
  }

  getState(): RecognitionState {
    return this.state
  }
}

export default VoiceInputModule.getInstance()
export type { VoiceConfig, RecognitionState }
