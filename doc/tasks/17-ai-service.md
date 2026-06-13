# 任务：AI服务层

**模块**: AIService  
**优先级**: P0  
**预计时间**: 3小时  
**状态**: 待开始

---

## 目标

封装阿里云百炼平台API调用（qwen-3.7plus推理 + qwen-image生图）。

---

## 任务清单

### 创建 `app/services/ai_service.py`

```python
import httpx
from app.config import settings
from app.errors import APIException, ErrorCode

class AIService:
    def __init__(self):
        self.api_key = settings.ALIYUN_API_KEY
        self.base_url = "https://dashscope.aliyuncs.com/api/v1"
    
    async def chat_completion(self, messages: list) -> str:
        """调用qwen-3.7plus"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/services/aigc/text-generation/generation",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": settings.QWEN_CHAT_MODEL,
                    "input": {"messages": messages}
                },
                timeout=settings.TIMEOUT
            )
            if response.status_code != 200:
                raise APIException(ErrorCode.AI_SERVICE_ERROR)
            return response.json()["output"]["text"]
    
    async def generate_image(self, prompt: str) -> str:
        """调用qwen-image，返回图片URL"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/services/aigc/text2image/image-synthesis",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": settings.QWEN_IMAGE_MODEL,
                    "input": {"prompt": prompt}
                },
                timeout=60
            )
            if response.status_code != 200:
                raise APIException(ErrorCode.IMAGE_GENERATION_FAILED)
            return response.json()["output"]["results"][0]["url"]
```

---

## 验收标准

- [x] 对话接口调用成功
- [x] 生图接口调用成功
- [x] 错误处理完善

---

## 相关文件

- `app/services/ai_service.py`

---

## 依赖项

- [15-config.md](./15-config.md)
- [16-error-handler.md](./16-error-handler.md)
