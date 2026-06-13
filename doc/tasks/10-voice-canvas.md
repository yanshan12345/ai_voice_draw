# 任务：主画布组件

**模块**: VoiceCanvas.vue  
**优先级**: P0  
**预计时间**: 4小时  
**状态**: 待开始

---

## 目标

主画布组件，协调所有模块，处理完整的指令执行流程。

---

## 任务清单

### 创建 `src/components/VoiceCanvas.vue`

**核心职责**:
- [ ] 集成所有模块（语音输入/输出、画布渲染、状态管理等）
- [ ] 处理语音识别结果
- [ ] 调用后端解析指令
- [ ] 执行指令（创建/调整/删除对象）
- [ ] 更新历史记录

**关键流程**:
```typescript
async handleVoiceResult(text: string) {
  store.setStatus('processing')
  
  // 1. 本地指令预处理
  const preprocessResult = commandPreprocessor.preprocess(text)
  if (preprocessResult.isHandled) {
    this.executeLocalCommand(preprocessResult.command)
    return
  }
  
  // 2. 发送后端解析
  const response = await apiService.parseCommand({
    text,
    canvas_state: { config: store.config, objects: store.objects }
  })
  
  // 3. 执行指令
  if (response.requires_image_generation) {
    const imgRes = await apiService.generateImage({
      prompt: response.command.parameters.prompt,
      canvas_context: this.buildCanvasContext()
    })
    this.createImageObject(imgRes.image_url, response.command.parameters)
  } else {
    this.executeCommand(response.command)
  }
  
  // 4. 记录历史
  historyManager.push(store.$state)
}
```

---

## 验收标准

- [x] 完整流程可运行
- [x] 错误处理完善
- [x] 状态更新及时

---

## 相关文件

- `src/components/VoiceCanvas.vue`

---

## 依赖项

所有前端模块
