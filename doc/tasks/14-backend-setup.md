# 任务：后端项目初始化

**模块**: 后端基础设施  
**优先级**: P0  
**预计时间**: 1.5小时  
**状态**: 待开始

---

## 目标

搭建FastAPI后端项目，配置开发环境。

---

## 任务清单

### 1. 创建项目结构
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── routes.py
│   ├── config.py
│   ├── errors.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── request.py
│   │   └── response.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_service.py
│   │   ├── command_parser.py
│   │   └── prompt_templates.py
│   └── utils/
│       └── helpers.py
├── .env
├── .env.example
└── requirements.txt
```

### 2. 创建 requirements.txt
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
pydantic-settings==2.1.0
httpx==0.26.0
python-dotenv==1.0.0
```

### 3. 创建 .env.example
```env
ALIYUN_API_KEY=your_api_key_here
QWEN_CHAT_MODEL=qwen-3.7plus
QWEN_IMAGE_MODEL=qwen-image
```

### 4. 创建基础 main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Voice Draw API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

---

## 验收标准

- [x] 项目结构创建完整
- [x] 依赖安装成功
- [x] 服务可启动：`uvicorn app.main:app --reload`
- [x] 访问 http://localhost:8000/api/health 返回正常

---

## 相关文件

- `backend/` 目录及所有基础文件

---

## 依赖项

无
