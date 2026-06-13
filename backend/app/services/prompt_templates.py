import json
from typing import Dict, Any

PARSE_PROMPT_TEMPLATE = """你是一个语音绘图助手，需要将用户的自然语言指令转换为结构化命令。

当前画布状态：
{canvas_state_json}

用户指令：{user_text}

请分析用户意图，输出JSON格式：
{{
  "intent": "create_object | adjust_object | delete_object | query_state | canvas_operation",
  "target": "对象名称或ID（如果适用）",
  "action": "具体操作描述",
  "parameters": {{
    "position": {{"x": 100, "y": 200}},
    "size": {{"width": 150, "height": 150}},
    "prompt": "根据用户指令提取的具体绘制内容，如：红色圆形、蓝色矩形、绿色三角形等"
  }},
  "confidence": 0.95
}}

注意：
1. 如果用户说"画圆"、"圆形"、"圆圈"，prompt应为具体描述如"a clean red circle"或"红色圆形"
2. prompt字段必须根据用户实际指令生成，不要使用占位符或无关内容
3. 只有intent为create_object时才需要prompt字段"""


def build_parse_prompt(user_text: str, canvas_state: dict) -> str:
    """构建完整的指令解析prompt"""
    canvas_state_json = json.dumps(canvas_state, ensure_ascii=False, indent=2)
    return PARSE_PROMPT_TEMPLATE.format(
        canvas_state_json=canvas_state_json,
        user_text=user_text
    )


def enhance_image_prompt(user_description: str, canvas_context: str) -> str:
    """增强生图prompt"""
    return f"""高质量数字绘画，{user_description}。
画面风格：简洁明快，色彩鲜明。
画布背景：{canvas_context}
要求：主体清晰，背景透明或纯色，适合叠加。"""
