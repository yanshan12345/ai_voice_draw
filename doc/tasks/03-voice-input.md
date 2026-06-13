# 任务：语音输入模块

**模块**: VoiceInput  
**优先级**: P0  
**预计时间**: 3小时  
**状态**: 待开始

---

## 目标

封装Web Speech API的SpeechRecognition，提供语音识别功能。

---

## 任务清单

### 创建 `src/modules/voiceInput.ts`

**核心功能**:
- [ ] 初始化语音识别
- [ ] 持续监听模式
- [ ] 按键激活模式（可选）
- [ ] 事件回调（结果、错误、开始、结束）
- [ ] 浏览器兼容性检测
- [ ] 自动重连机制

**关键实现**:
```typescript
class VoiceInput {
  private recognition: SpeechRecognition | null = null
  private isListening = false
  
  init(config: VoiceConfig) {
    if (!('webkitSpeechRecognition' in window)) {
      throw new Error('浏览器不支持语音识别')
    }
    this.recognition = new webkitSpeechRecognition()
    this.recognition.lang = config.lang
    this.recognition.continuous = config.continuous
    this.recognition.interimResults = config.interimResults
    this.setupEventListeners()
  }
  
  startContinuousListening() { /* ... */ }
  stopListening() { /* ... */ }
  onResult(callback: (text: string, confidence: number) => void) { /* ... */ }
}
```

---

## 验收标准

- [x] 可正常识别中文语音
- [x] 事件回调正常触发
- [x] 不支持的浏览器抛出友好错误
- [x] 识别中断后自动重连

---

## 测试要点

- 说话时能实时识别
- 停顿后返回最终结果
- 识别错误时触发error回调

---

## 相关文件

- `src/modules/voiceInput.ts`

---

## 依赖项

- [01-types.md](./01-types.md)
