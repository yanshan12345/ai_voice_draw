# 任务：语音输出模块

**模块**: VoiceOutput  
**优先级**: P0  
**预计时间**: 2小时  
**状态**: 待开始

---

## 目标

封装Web Speech API的SpeechSynthesis，提供TTS播报功能。

---

## 任务清单

### 创建 `src/modules/voiceOutput.ts`

**核心功能**:
- [ ] 初始化TTS
- [ ] 播报文本（支持队列）
- [ ] 停止/暂停/恢复
- [ ] 开关控制

**关键实现**:
```typescript
class VoiceOutput {
  private enabled = true
  private queue: string[] = []
  
  speak(text: string, priority: 'high' | 'normal' = 'normal') {
    if (!this.enabled) return
    if (priority === 'high') {
      window.speechSynthesis.cancel()
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 1.0
    window.speechSynthesis.speak(utterance)
  }
  
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) window.speechSynthesis.cancel()
  }
}
```

---

## 验收标准

- [x] 能正常播报中文
- [x] 高优先级可打断当前播报
- [x] 开关控制生效

---

## 相关文件

- `src/modules/voiceOutput.ts`

---

## 依赖项

- [01-types.md](./01-types.md)
