# 任务：TypeScript类型定义

**模块**: 基础类型系统  
**优先级**: P0  
**预计时间**: 1小时  
**状态**: 待开始

---

## 目标

定义项目中所有模块使用的TypeScript类型和接口。

---

## 任务清单

### 创建 `src/types/index.ts`

```typescript
// 画布对象类型
export interface CanvasObject {
  id: string
  type: 'image' | 'shape' | 'text'
  name: string
  description: string
  position: {x: number, y: number}
  size: {width: number, height: number}
  rotation: number
  opacity: number
  zIndex: number
  createdAt: number
  data: ImageData | ShapeData | TextData
}

export interface ImageData {
  url: string
  naturalWidth: number
  naturalHeight: number
}

export interface ShapeData {
  shapeType: 'circle' | 'rectangle' | 'line' | 'ellipse'
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  params: Record<string, any>
}

export interface TextData {
  content: string
  font: string
  fontSize: number
  color: string
}

// 画布状态
export interface CanvasState {
  config: {
    width: number
    height: number
    backgroundColor: string
  }
  objects: CanvasObject[]
  selectedObjectId: string | null
  status: 'idle' | 'listening' | 'processing' | 'generating'
  currentVoiceText: string
  error: string | null
}

// API相关
export interface CommandRequest {
  text: string
  canvas_state: {
    config: CanvasState['config']
    objects: CanvasObject[]
  }
}

export interface ParsedCommand {
  intent: 'create_object' | 'adjust_object' | 'delete_object' | 'query_state' | 'canvas_operation'
  target?: string
  action: string
  parameters: Record<string, any>
  confidence: number
  confirmation_needed: boolean
}

export interface CommandResponse {
  success: boolean
  command?: ParsedCommand
  message: string
  requires_image_generation: boolean
}

export interface ImageGenerateRequest {
  prompt: string
  canvas_context: string
  size?: string
}

export interface ImageGenerateResponse {
  success: boolean
  image_url?: string
  error?: string
}

// 语音配置
export interface VoiceConfig {
  lang: string
  continuous: boolean
  interimResults: boolean
}

export interface TTSConfig {
  lang: string
  rate: number
  pitch: number
  volume: number
}

// 本地指令
export type LocalCommand = 
  | {type: 'undo'}
  | {type: 'redo'}
  | {type: 'clear'}
  | {type: 'save', format?: 'png' | 'jpg'}
  | {type: 'help'}
  | {type: 'toggle_tts'}
  | {type: 'unknown'}
```

---

## 验收标准

- [x] 所有接口定义完整
- [x] 类型可在其他模块正常导入
- [x] 无TypeScript编译错误

---

## 相关文件

- `src/types/index.ts`

---

## 依赖项

- [00-project-setup.md](./00-project-setup.md)

---

## 后续任务

所有其他模块都依赖此类型定义
