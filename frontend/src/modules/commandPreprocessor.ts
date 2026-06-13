/**
 * Command Preprocessor Module
 * Quickly matches common command keywords to avoid sending simple commands to backend
 */

import type { CommandPreprocessorModule, PreprocessResult, LocalCommand } from '../types'

const KEYWORDS: Record<string, string[]> = {
  undo: ['撤销', '后退', '回退', '上一步'],
  redo: ['重做', '前进', '下一步'],
  clear: ['清空', '清空画布', '全部删除'],
  save: ['保存', '导出', '下载'],
  help: ['帮助', '怎么用', '使用方法'],
  toggle_tts: ['关闭语音', '打开语音', '语音播报']
}

class CommandPreprocessor implements CommandPreprocessorModule {
  preprocess(text: string): PreprocessResult {
    const normalized = text.trim()

    for (const [commandType, keywords] of Object.entries(KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalized.includes(keyword)) {
          return {
            isHandled: true,
            command: { type: commandType } as LocalCommand,
            originalText: text
          }
        }
      }
    }

    return {
      isHandled: false,
      originalText: text
    }
  }
}

export const commandPreprocessor = new CommandPreprocessor()
