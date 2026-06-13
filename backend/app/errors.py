# 错误码常量
INVALID_COMMAND = 1001
AI_SERVICE_ERROR = 2001
IMAGE_GENERATION_FAILED = 2002
RATE_LIMIT_EXCEEDED = 3001
INTERNAL_ERROR = 5000

# 错误消息映射
ERROR_MESSAGES = {
    INVALID_COMMAND: "无效的指令格式",
    AI_SERVICE_ERROR: "AI服务错误",
    IMAGE_GENERATION_FAILED: "图片生成失败",
    RATE_LIMIT_EXCEEDED: "请求频率超限",
    INTERNAL_ERROR: "内部服务器错误"
}

# 自定义异常类
class CommandParseError(Exception):
    def __init__(self, message: str = None):
        self.error_code = INVALID_COMMAND
        self.message = message or ERROR_MESSAGES[INVALID_COMMAND]

class AIServiceError(Exception):
    def __init__(self, message: str = None):
        self.error_code = AI_SERVICE_ERROR
        self.message = message or ERROR_MESSAGES[AI_SERVICE_ERROR]

class ImageGenerationError(Exception):
    def __init__(self, message: str = None):
        self.error_code = IMAGE_GENERATION_FAILED
        self.message = message or ERROR_MESSAGES[IMAGE_GENERATION_FAILED]
