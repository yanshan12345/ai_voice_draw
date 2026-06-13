# 任务：配置管理

**模块**: Config  
**优先级**: P0  
**预计时间**: 0.5小时  
**状态**: 待开始

---

## 目标

使用pydantic-settings管理配置和环境变量。

---

## 任务清单

### 创建 `app/config.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ALIYUN_API_KEY: str
    QWEN_CHAT_MODEL: str = "qwen-3.7plus"
    QWEN_IMAGE_MODEL: str = "qwen-image"
    MAX_RETRIES: int = 3
    TIMEOUT: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 验收标准

- [x] 环境变量正确加载
- [x] 配置可在其他模块导入使用

---

## 相关文件

- `app/config.py`

---

## 依赖项

- [14-backend-setup.md](./14-backend-setup.md)
