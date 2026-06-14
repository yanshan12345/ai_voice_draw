from fastapi import APIRouter, Depends
from app.models.request import CommandRequest, ImageGenerateRequest
from app.models.response import CommandResponse, ImageGenerateResponse
from app.services.ai_service import AIService
from app.services.command_parser import CommandParser
from app.services.prompt_templates import enhance_image_prompt
from app.config import get_settings
from app.errors import ImageGenerationError

router = APIRouter()

def get_ai_service():
    return AIService()

def get_command_parser(ai_service: AIService = Depends(get_ai_service)):
    return CommandParser(ai_service)

@router.post("/command/parse", response_model=CommandResponse)
async def parse_command(
    request: CommandRequest,
    parser: CommandParser = Depends(get_command_parser)
):
    command = await parser.parse(request.text, request.canvas_state)

    requires_image = command.intent == "create_object" and "prompt" in command.parameters

    return CommandResponse(
        success=True,
        command=command,
        message=f"正在执行: {command.action}",
        requires_image_generation=requires_image
    )

@router.post("/image/generate", response_model=ImageGenerateResponse)
async def generate_image(
    request: ImageGenerateRequest,
    ai_service: AIService = Depends(get_ai_service)
):
    try:
        enhanced_prompt = enhance_image_prompt(request.prompt, request.canvas_context)
        image_url = await ai_service.generate_image(enhanced_prompt, size=request.size)

        return ImageGenerateResponse(
            success=True,
            image_url=image_url,
            error=None
        )
    except Exception as e:
        raise ImageGenerationError(f"图像生成失败: {str(e)}")
