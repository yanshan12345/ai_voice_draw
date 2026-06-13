# 任务：状态管理模块

**模块**: CanvasStore (Pinia)  
**优先级**: P0  
**预计时间**: 2小时  
**状态**: 待开始

---

## 目标

使用Pinia管理画布状态，提供集中式状态访问和修改。

---

## 任务清单

### 创建 `src/stores/canvasStore.ts`

```typescript
import { defineStore } from 'pinia'
import type { CanvasState, CanvasObject } from '@/types'

export const useCanvasStore = defineStore('canvas', {
  state: (): CanvasState => ({
    config: { width: 1920, height: 1080, backgroundColor: '#FFFFFF' },
    objects: [],
    selectedObjectId: null,
    status: 'idle',
    currentVoiceText: '',
    error: null
  }),
  
  getters: {
    getObjectById: (state) => (id: string) => 
      state.objects.find(obj => obj.id === id),
    getSortedObjects: (state) => 
      [...state.objects].sort((a, b) => a.zIndex - b.zIndex)
  },
  
  actions: {
    addObject(obj: CanvasObject) { this.objects.push(obj) },
    updateObject(id: string, updates: Partial<CanvasObject>) {
      const obj = this.objects.find(o => o.id === id)
      if (obj) Object.assign(obj, updates)
    },
    deleteObject(id: string) {
      this.objects = this.objects.filter(o => o.id !== id)
    },
    clearObjects() { this.objects = [] },
    setStatus(status: CanvasState['status']) { this.status = status }
  }
})
```

---

## 验收标准

- [x] 状态结构完整
- [x] Getters和Actions正常工作
- [x] 可在组件中正常使用

---

## 相关文件

- `src/stores/canvasStore.ts`

---

## 依赖项

- [00-project-setup.md](./00-project-setup.md)
- [01-types.md](./01-types.md)
