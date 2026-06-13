import { describe, it, expect, beforeEach } from 'vitest'
import historyManager from '../historyManager'
import type { CanvasState } from '../../types'

const createState = (bg: string): CanvasState => ({
  config: { width: 1920, height: 1080, backgroundColor: bg },
  objects: [],
  selectedObjectId: null,
  status: 'idle',
  currentVoiceText: '',
  error: null
})

describe('historyManager', () => {
  beforeEach(() => {
    historyManager.clear()
  })

  it('should push states to undo stack', () => {
    historyManager.push(createState('#fff'))
    expect(historyManager.getHistoryLength()).toBe(1)
  })

  it('should undo and return previous state', () => {
    const state1 = createState('#fff')
    const state2 = createState('#000')
    historyManager.push(state1)
    historyManager.push(state2)

    const undone = historyManager.undo()
    expect(undone).toEqual(state2)
    expect(historyManager.canRedo()).toBe(true)
  })

  it('should redo and return next state', () => {
    const state = createState('#fff')
    historyManager.push(state)
    historyManager.undo()

    const redone = historyManager.redo()
    expect(redone).toEqual(state)
  })

  it('should limit history to 50 states', () => {
    for (let i = 0; i < 60; i++) {
      historyManager.push(createState(`#${i}`))
    }
    expect(historyManager.getHistoryLength()).toBe(50)
  })

  it('should clear redo stack on new push', () => {
    historyManager.push(createState('#fff'))
    historyManager.push(createState('#000'))
    historyManager.undo()

    expect(historyManager.canRedo()).toBe(true)
    historyManager.push(createState('#aaa'))
    expect(historyManager.canRedo()).toBe(false)
  })

  it('should return null when undo stack is empty', () => {
    expect(historyManager.undo()).toBeNull()
  })

  it('should return null when redo stack is empty', () => {
    expect(historyManager.redo()).toBeNull()
  })
})
