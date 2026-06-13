# 任务：导出模块

**模块**: Exporter  
**优先级**: P0  
**预计时间**: 1小时  
**状态**: 待开始

---

## 目标

将Canvas导出为图像文件并触发下载。

---

## 任务清单

### 创建 `src/modules/exporter.ts`

```typescript
export class Exporter {
  export(canvas: HTMLCanvasElement, format: 'png' | 'jpg', filename?: string) {
    const name = filename || `ai-voice-draw-${Date.now()}`
    const quality = format === 'jpg' ? 0.9 : 1.0
    
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    }, `image/${format}`, quality)
  }
}
```

---

## 验收标准

- [x] PNG导出正常
- [x] JPG导出正常
- [x] 文件名包含时间戳

---

## 相关文件

- `src/modules/exporter.ts`
