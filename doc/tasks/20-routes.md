# 任务：API路由层

**模块**: Routes  
**优先级**: P0  
**预计时间**: 2小时  
**状态**: 待开始

---

## 目标

定义HTTP接口，连接前端和后端服务。

---

## 任务清单

### 创建 `app/models/request.py` 和 `response.py`

```python
# request.py
from pydantic import BaseModel

class CommandRequest(BaseModel):
    text: str
    canvas_state: dict

class ImageGenerateRequest(BaseModel):
    prompt: str
    canvas_context: str
    size: str = "1024x1024"

# response.py
from pydantic import BaseModel
from typing import Optional

class ParsedCommand(BaseModel):
    intent: str
    target: Optional[str] = None
    action: str
    parameters: dict
    confidence: float
    confirmation_needed: bool = False

class CommandResponse(BaseModel):
    success: bool
    command: Optional[ParsedCommand] = None
    message: str
    requires_image_generation: bool

class ImageGenerateResponse(BaseModel):
    success: bool
    image_url: Optional[str] = None
    error: Optional[str] = None
```

### 创建 `app/routes.py`

```python
from fastapi import APIRouter
from app.models.request import CommandRequest, ImageGenerateRequest
from app.models.response import CommandResponse, ImageGenerateResponse
from app.services.command_parser import CommandParser
from app.services.ai_service import AIService
from app.services.prompt_templates import enhance_image_prompt

router = APIRouter(prefix="/api")
command_parser = CommandParser()
ai_service = AIService()

@router.post("/command/parse", response_model=CommandResponse)
async def parse_command(request: CommandRequest):
    command = await command_parser.parse(request.text, request.canvas_state)
    requires_gen = command.intent == "create_object"
    
    return CommandResponse(
        success=True,
        command=command,
        message="指令解析成功",
        requires_image_generation=requires_gen
    )

@router.post("/image/generate", response_model=ImageGenerateResponse)
async def generate_image(request: ImageGenerateRequest):
    prompt = enhance_image_prompt(request.prompt, request.canvas_context)
    image_url = await ai_service.generate_image(prompt)
    
    return ImageGenerateResponse(success=True, image_url=image_url)
```

在 `main.py` 中注册：
```python
from app.routes import router
app.include_router(router)
```

---

## 验收标准

- [x] 所有接口定义完整
- [x] 数据模型验证正常
- [x] 接口可正常调用

---

## 相关文件

- `app/routes.py`
- `app/models/`

---

## 依赖项

- [19-command-parser.md](./19-command-parser.md)
- [17-ai-service.md](./17-ai-service.md)
