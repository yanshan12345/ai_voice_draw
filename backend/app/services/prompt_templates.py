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
    "scale": 2.0,
    "rotation": 30,
    "opacity": 0.8,
    "prompt": "根据用户指令提取的具体绘制内容，如：红色圆形、蓝色矩形、绿色三角形等"
  }},
  "confidence": 0.95
}}

**重要坐标规则**：
1. 画布尺寸：宽度1920px，高度1080px
2. 坐标系统：左上角为(0,0)，右下角为(1920,1080)
3. **图像定位方式**：position坐标是图像的**中心点**位置，不是左上角
4. 边界计算：要让图像完全在画布内，需要考虑图像尺寸
   - 左边界：x ≥ width/2 (图像中心距离左边至少半个宽度)
   - 右边界：x ≤ 1920 - width/2
   - 上边界：y ≥ height/2
   - 下边界：y ≤ 1080 - height/2
5. 位置描述对应坐标（已考虑图像尺寸）：
   - "左上角"：x=width/2, y=height/2（如200x200图像则为100,100）
   - "右上角"：x=1920-width/2, y=height/2
   - "左下角"：x=width/2, y=1080-height/2
   - "右下角"：x=1920-width/2, y=1080-height/2
   - "中央"：x=960, y=540

注意：
1. 如果用户说"画圆"、"圆形"、"圆圈"，prompt应为具体描述如"a clean red circle"或"红色圆形"
2. prompt字段必须根据用户实际指令生成，不要使用占位符或无关内容
3. 只有intent为create_object时才需要prompt字段
4. 调整对象位置时，必须确保计算后的坐标不会让图像超出画布边界
5. **对象命名规则**：
   - 创建对象时，parameters中必须包含"name"字段，给对象起具体名字（如"太阳"、"云朵"、"小鸟"）
   - 调整/删除对象时，target字段应精确匹配对象名称
   - 如果用户说"图像1"、"第一个图像"，应根据画布状态中的对象列表顺序确定具体对象名称
6. **尺寸调整规则**：
   - 绝对尺寸：直接使用size字段，如{{"width": 300, "height": 300}}
   - 相对调整（放大/缩小）：使用scale字段表示倍数
     * "放大2倍" → "scale": 2.0
     * "缩小一半" → "scale": 0.5
     * "放大3倍" → "scale": 3.0
   - 不要同时返回size和scale，相对调整只用scale"""


def build_parse_prompt(user_text: str, canvas_state: dict) -> str:
    """构建完整的指令解析prompt"""
    canvas_state_json = json.dumps(canvas_state, ensure_ascii=False, indent=2)
    return PARSE_PROMPT_TEMPLATE.format(
        canvas_state_json=canvas_state_json,
        user_text=user_text
    )


def enhance_image_prompt(user_description: str, canvas_context: str) -> str:
    """增强生图prompt - 简笔画矢量风格，透明背景"""
    return f"""Simple line drawing of {user_description}, minimalist vector art style, flat design, clean and simple outlines, black lines on transparent background, svg style illustration, no shading, no gradients, icon-like simplicity, suitable for children's book, cartoon style, isolated on transparent backdrop, PNG with alpha channel."""
