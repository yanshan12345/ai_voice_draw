# 任务：画布渲染模块

**模块**: CanvasRenderer  
**优先级**: P0  
**预计时间**: 4小时  
**状态**: 待开始

---

## 目标

管理Canvas渲染，绘制画布对象（图像、几何图形、文字）。

---

## 任务清单

### 创建 `src/modules/canvasRenderer.ts`

**核心功能**:
- [ ] 初始化Canvas
- [ ] 渲染对象列表（按zIndex排序）
- [ ] 应用变换（位置、缩放、旋转、透明度）
- [ ] 清空画布
- [ ] 导出图像数据

**关键实现**:
```typescript
class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private imageCache = new Map<string, HTMLImageElement>()
  
  render(objects: CanvasObject[]) {
    this.clear()
    const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex)
    
    sorted.forEach(obj => {
      this.ctx.save()
      this.applyTransform(obj)
      this.ctx.globalAlpha = obj.opacity
      
      if (obj.type === 'image') this.renderImage(obj)
      else if (obj.type === 'shape') this.renderShape(obj)
      else if (obj.type === 'text') this.renderText(obj)
      
      this.ctx.restore()
    })
  }
  
  private applyTransform(obj: CanvasObject) {
    this.ctx.translate(obj.position.x, obj.position.y)
    this.ctx.rotate(obj.rotation * Math.PI / 180)
  }
  
  exportImage(format: 'png' | 'jpg'): Blob { /* ... */ }
}
```

---

## 验收标准

- [x] 对象按zIndex正确渲染
- [x] 变换效果正确（位置、旋转、透明度）
- [x] 图像预加载和缓存
- [x] 导出功能正常

---

## 相关文件

- `src/modules/canvasRenderer.ts`

---

## 依赖项

- [01-types.md](./01-types.md)
