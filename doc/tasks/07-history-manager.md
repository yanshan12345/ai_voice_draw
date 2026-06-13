# 任务：历史管理模块

**模块**: HistoryManager  
**优先级**: P0  
**预计时间**: 2小时  
**状态**: 待开始

---

## 目标

实现撤销/重做功能，管理画布状态历史。

---

## 任务清单

### 创建 `src/modules/historyManager.ts`

```typescript
class HistoryManager {
  private undoStack: CanvasState[] = []
  private redoStack: CanvasState[] = []
  private maxHistory = 50
  
  push(state: CanvasState) {
    this.undoStack.push(JSON.parse(JSON.stringify(state)))
    this.redoStack = []
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift()
    }
  }
  
  undo(): CanvasState | null {
    if (this.undoStack.length === 0) return null
    const state = this.undoStack.pop()!
    this.redoStack.push(state)
    return this.undoStack[this.undoStack.length - 1] || null
  }
  
  redo(): CanvasState | null {
    if (this.redoStack.length === 0) return null
    const state = this.redoStack.pop()!
    this.undoStack.push(state)
    return state
  }
}
```

---

## 验收标准

- [x] 撤销功能正常
- [x] 重做功能正常
- [x] 状态深拷贝避免引用污染
- [x] 历史记录限制生效

---

## 相关文件

- `src/modules/historyManager.ts`

---

## 依赖项

- [01-types.md](./01-types.md)
