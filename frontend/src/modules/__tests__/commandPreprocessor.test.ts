import { describe, it, expect } from 'vitest'
import { commandPreprocessor } from '../commandPreprocessor'

describe('commandPreprocessor', () => {
  it('should match undo keywords', () => {
    const result = commandPreprocessor.preprocess('撤销')
    expect(result.isHandled).toBe(true)
    expect(result.command?.type).toBe('undo')
  })

  it('should match save keywords', () => {
    const result = commandPreprocessor.preprocess('保存')
    expect(result.isHandled).toBe(true)
    expect(result.command?.type).toBe('save')
  })

  it('should match redo keywords', () => {
    const result = commandPreprocessor.preprocess('重做')
    expect(result.isHandled).toBe(true)
    expect(result.command?.type).toBe('redo')
  })

  it('should match clear keywords', () => {
    const result = commandPreprocessor.preprocess('清空')
    expect(result.isHandled).toBe(true)
    expect(result.command?.type).toBe('clear')
  })

  it('should not match unknown commands', () => {
    const result = commandPreprocessor.preprocess('画一个圆')
    expect(result.isHandled).toBe(false)
    expect(result.command).toBeUndefined()
  })

  it('should preserve original text', () => {
    const text = '撤销上一步'
    const result = commandPreprocessor.preprocess(text)
    expect(result.originalText).toBe(text)
  })
})
