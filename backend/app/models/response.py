from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal

class ParsedCommand(BaseModel):
    intent: Literal["create_object", "adjust_object", "delete_object", "query_state", "canvas_operation"]
    target: Optional[str] = None
    action: str
    parameters: Dict[str, Any]
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
