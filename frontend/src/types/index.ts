/**
 * AI Voice Draw - TypeScript Type Definitions
 */

// ============================================================================
// Voice Module Types
// ============================================================================

/** Voice recognition configuration */
export interface VoiceConfig {
  lang: string
  continuous: boolean
  interimResults: boolean
}

/** Text-to-speech configuration */
export interface TTSConfig {
  lang: string
  rate: number
  pitch: number
  volume: number
}

// ============================================================================
// Canvas Object Types
// ============================================================================

/** Canvas object base structure */
export interface CanvasObject {
  id: string
  type: 'image' | 'shape' | 'text'
  name: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  opacity: number
  zIndex: number
  data: ImageData | ShapeData | TextData
}

/** Image object data */
export interface ImageData {
  url: string
  naturalWidth: number
  naturalHeight: number
}

/** Shape object data */
export interface ShapeData {
  shapeType: 'circle' | 'rectangle' | 'line' | 'ellipse'
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  radius?: number
  width?: number
  height?: number
  endX?: number
  endY?: number
  radiusX?: number
  radiusY?: number
}

/** Text object data */
export interface TextData {
  content: string
  font: string
  fontSize: number
  color: string
}

// ============================================================================
// Canvas State Types
// ============================================================================

/** Canvas state */
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

/** Canvas state DTO for API transmission */
export interface CanvasStateDTO {
  config: {
    width: number
    height: number
    backgroundColor: string
  }
  objects: CanvasObjectDTO[]
}

/** Canvas object DTO */
export interface CanvasObjectDTO {
  id: string
  type: 'image' | 'shape' | 'text'
  name: string
  description: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  opacity: number
  zIndex: number
  createdAt: number
  data: ImageData | ShapeData | TextData
}

// ============================================================================
// Command Types
// ============================================================================

/** Parsed command from backend */
export interface ParsedCommand {
  intent: 'create_object' | 'adjust_object' | 'delete_object' | 'query_state' | 'canvas_operation'
  target: string | null
  action: string
  parameters: Record<string, any>
  confirmation_needed: boolean
  confidence: number
}

/** Local command types */
export type LocalCommand =
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'clear' }
  | { type: 'save'; format?: 'png' | 'jpg' }
  | { type: 'help' }
  | { type: 'toggle_tts' }
  | { type: 'unknown' }

/** Preprocessor result */
export interface PreprocessResult {
  isHandled: boolean
  command?: LocalCommand
  originalText: string
}

// ============================================================================
// API Types
// ============================================================================

/** Command parse request */
export interface CommandRequest {
  text: string
  canvas_state: CanvasStateDTO
}

/** Command parse response */
export interface CommandResponse {
  success: boolean
  command: ParsedCommand | null
  message: string
  requires_image_generation: boolean
}

/** Image generation request */
export interface ImageGenerateRequest {
  prompt: string
  canvas_context: string
  size?: string
}

/** Image generation response */
export interface ImageGenerateResponse {
  success: boolean
  image_url: string | null
  error: string | null
}

/** API error response */
export interface ApiErrorResponse {
  success: false
  error_code: number
  message: string
}

// ============================================================================
// Module Interfaces
// ============================================================================

/** Voice input module interface */
export interface VoiceInputModule {
  init(config: VoiceConfig): void
  startContinuousListening(): void
  stopListening(): void
  startPushToTalk(): void
  stopPushToTalk(): void
  enableWakeWord(word: string): void
  onResult(callback: (text: string, confidence: number) => void): void
  onError(callback: (error: Error) => void): void
  onStart(callback: () => void): void
  onEnd(callback: () => void): void
}

/** Voice output module interface */
export interface VoiceOutputModule {
  init(config: TTSConfig): void
  speak(text: string, priority?: 'high' | 'normal'): Promise<void>
  stop(): void
  pause(): void
  resume(): void
  setEnabled(enabled: boolean): void
  isEnabled(): boolean
}

/** Canvas renderer module interface */
export interface CanvasRendererModule {
  init(canvas: HTMLCanvasElement, width: number, height: number): void
  render(objects: CanvasObject[]): void
  clear(): void
  setBackground(color: string | ImageData): void
  exportImage(format: 'png' | 'jpg', quality?: number): Blob
  screenToCanvas(x: number, y: number): { x: number; y: number }
}

/** History manager module interface */
export interface HistoryManagerModule {
  push(state: CanvasState): void
  undo(): CanvasState | null
  redo(): CanvasState | null
  canUndo(): boolean
  canRedo(): boolean
  clear(): void
  getHistoryLength(): number
}

/** Command preprocessor module interface */
export interface CommandPreprocessorModule {
  preprocess(text: string): PreprocessResult
}

/** Exporter module interface */
export interface ExporterModule {
  export(canvas: HTMLCanvasElement, format: 'png' | 'jpg', filename?: string): void
}
