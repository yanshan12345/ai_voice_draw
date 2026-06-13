from pydantic import BaseModel
from typing import List, Dict, Any

class CommandRequest(BaseModel):
    text: str
    canvas_state: Dict[str, Any]

class ImageGenerateRequest(BaseModel):
    prompt: str
    canvas_context: str
    size: str = "1024*1024"
