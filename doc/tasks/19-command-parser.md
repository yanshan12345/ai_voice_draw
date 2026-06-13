# 任务：指令解析服务

**模块**: CommandParser  
**优先级**: P0  
**预计时间**: 3小时  
**状态**: 待开始

---

## 目标

调用qwen-3.7plus理解用户意图，返回结构化指令。

---

## 任务清单

### 创建 `app/services/command_parser.py`

```python
import json
from app.services.ai_service import AIService
from app.services.prompt_templates import build_parse_prompt
from app.models.response import ParsedCommand

class CommandParser:
    def __init__(self):
        self.ai_service = AIService()
    
    async def parse(self, text: str, canvas_state: dict) -> ParsedCommand:
        prompt = build_parse_prompt(text, json.dumps(canvas_state, ensure_ascii=False))
        messages = [{"role": "user", "content": prompt}]
        
        result = await self.ai_service.chat_completion(messages)
        command_dict = json.loads(result)
        
        return ParsedCommand(**command_dict)
```

---

## 验收标准

- [x] 指令解析准确
- [x] 返回结构化数据

---

## 相关文件

- `app/services/command_parser.py`

---

## 依赖项

- [17-ai-service.md](./17-ai-service.md)
- [18-prompt-templates.md](./18-prompt-templates.md)
