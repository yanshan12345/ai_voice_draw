import json
import re
from app.services.ai_service import AIService
from app.services.prompt_templates import build_parse_prompt
from app.models.response import ParsedCommand
from app.errors import CommandParseError, AIServiceError


class CommandParser:
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service

    async def parse(self, text: str, canvas_state: dict) -> ParsedCommand:
        """解析指令"""
        prompt = build_parse_prompt(text, canvas_state)

        try:
            ai_response = await self.ai_service.chat_completion([
                {"role": "user", "content": prompt}
            ])
        except Exception as e:
            raise AIServiceError(f"AI调用失败: {str(e)}")

        try:
            parsed_json = self._extract_json(ai_response)
            return ParsedCommand(**parsed_json)
        except Exception as e:
            raise CommandParseError(f"JSON解析失败: {str(e)}")

    def _extract_json(self, text: str) -> dict:
        """提取JSON内容"""
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))

        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))

        return json.loads(text)
