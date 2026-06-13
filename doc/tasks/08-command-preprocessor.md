# 任务：指令预处理模块

**模块**: CommandPreprocessor  
**优先级**: P0  
**预计时间**: 1.5小时  
**状态**: 待开始

---

## 目标

快速匹配常用指令关键词，避免简单指令发送到后端。

---

## 任务清单

### 创建 `src/modules/commandPreprocessor.ts`

```typescript
const KEYWORDS = {
  undo: ['撤销', '后退', '回退', '上一步'],
  redo: ['重做', '前进', '下一步'],
  clear: ['清空', '清空画布', '全部删除'],
  save: ['保存', '导出', '下载'],
  help: ['帮助', '怎么用', '使用方法'],
  toggle_tts: ['关闭语音', '打开语音', '语音播报']
}

class CommandPreprocessor {
  preprocess(text: string): {isHandled: boolean, command?: LocalCommand} {
    const normalized = text.trim().toLowerCase()
    
    for (const [cmd, keywords] of Object.entries(KEYWORDS)) {
      if (keywords.some(kw => normalized.includes(kw))) {
        return {isHandled: true, command: {type: cmd as any}}
      }
    }
    
    return {isHandled: false}
  }
}
```

---

## 验收标准

- [x] 关键词匹配准确
- [x] 未匹配的指令返回isHandled=false

---

## 相关文件

- `src/modules/commandPreprocessor.ts`

---

## 依赖项

- [01-types.md](./01-types.md)
