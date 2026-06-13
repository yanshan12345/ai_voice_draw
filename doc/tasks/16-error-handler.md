# 任务：错误处理

**模块**: ErrorHandler  
**优先级**: P0  
**预计时间**: 1小时  
**状态**: 待开始

---

## 目标

统一异常处理和错误响应格式。

---

## 任务清单

### 创建 `app/errors.py`

```python
from fastapi import Request
from fastapi.responses import JSONResponse

class ErrorCode:
    INVALID_COMMAND = 1001
    AI_SERVICE_ERROR = 2001
    IMAGE_GENERATION_FAILED = 2002
    RATE_LIMIT_EXCEEDED = 3001
    INTERNAL_ERROR = 5000

ERROR_MESSAGES = {
    1001: "无法理解该指令，请重新描述",
    2001: "AI服务暂时不可用",
    2002: "图像生成失败",
    3001: "请求过于频繁，请稍后再试",
    5000: "系统内部错误"
}

class APIException(Exception):
    def __init__(self, error_code: int, detail: str = None):
        self.error_code = error_code
        self.detail = detail or ERROR_MESSAGES.get(error_code, "未知错误")

async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error_code": exc.error_code,
            "message": exc.detail
        }
    )
```

在 main.py 注册：
```python
from app.errors import APIException, api_exception_handler
app.add_exception_handler(APIException, api_exception_handler)
```

---

## 验收标准

- [x] 错误码定义完整
- [x] 异常处理器正常工作

---

## 相关文件

- `app/errors.py`

---

## 依赖项

- [14-backend-setup.md](./14-backend-setup.md)
