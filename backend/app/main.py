from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import router
from app.config import get_settings
from app.errors import CommandParseError, AIServiceError, ImageGenerationError, INTERNAL_ERROR, ERROR_MESSAGES
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时验证配置
    settings = get_settings()
    print(f"配置加载成功: 模型={settings.QWEN_CHAT_MODEL}, 超时={settings.TIMEOUT}秒")
    yield

app = FastAPI(title="AI Voice Draw API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.exception_handler(CommandParseError)
async def command_parse_error_handler(request: Request, exc: CommandParseError):
    return JSONResponse(
        status_code=400,
        content={"success": False, "error_code": exc.error_code, "message": exc.message}
    )

@app.exception_handler(AIServiceError)
async def ai_service_error_handler(request: Request, exc: AIServiceError):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error_code": exc.error_code, "message": exc.message}
    )

@app.exception_handler(ImageGenerationError)
async def image_generation_error_handler(request: Request, exc: ImageGenerationError):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error_code": exc.error_code, "message": exc.message}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error_code": INTERNAL_ERROR, "message": ERROR_MESSAGES[INTERNAL_ERROR]}
    )

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
