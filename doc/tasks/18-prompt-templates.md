# 任务：Prompt工程

**模块**: PromptTemplates  
**优先级**: P0  
**预计时间**: 2小时  
**状态**: 待开始

---

## 目标

设计和管理Prompt模板，用于指令解析和图像生成。

---

## 任务清单

### 创建 `app/services/prompt_templates.py`

```python
def build_parse_prompt(user_text: str, canvas_state: dict) -> str:
    """构建指令解析prompt"""
    return f"""你是一个语音绘图助手，将自然语言转换为结构化指令。

当前画布状态：
{canvas_state}

用户指令：{user_text}

输出JSON格式：
{{
  "intent": "create_object | adjust_object | delete_object | query_state",
  "target": "对象名称",
  "action": "操作描述",
  "parameters": {{}},
  "confidence": 0.95
}}"""

def enhance_image_prompt(description: str, context: str) -> str:
    """增强图像生成prompt"""
    return f"高质量数字绘画，{description}，简洁明快，色彩鲜明。画布背景：{context}"
```

---

## 验收标准

- [x] Prompt模板清晰有效
- [x] 可灵活组合上下文

---

## 相关文件

- `app/services/prompt_templates.py`
