import type { CanvasState } from '../types'

const MAX_HISTORY = 50

class HistoryManagerModule {
  private static instance: HistoryManagerModule | null = null
  private undoStack: CanvasState[] = []
  private redoStack: CanvasState[] = []

  private constructor() {}

  static getInstance(): HistoryManagerModule {
    if (!HistoryManagerModule.instance) {
      HistoryManagerModule.instance = new HistoryManagerModule()
    }
    return HistoryManagerModule.instance
  }

  push(state: CanvasState): void {
    this.undoStack.push(this.deepCopy(state))
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift()
    }
    this.redoStack = []
  }

  undo(): CanvasState | null {
    if (this.undoStack.length === 0) return null
    const state = this.undoStack.pop()!
    this.redoStack.push(state)
    return this.deepCopy(state)
  }

  redo(): CanvasState | null {
    if (this.redoStack.length === 0) return null
    const state = this.redoStack.pop()!
    this.undoStack.push(state)
    return this.deepCopy(state)
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  getHistoryLength(): number {
    return this.undoStack.length
  }

  private deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }
}

export default HistoryManagerModule.getInstance()
