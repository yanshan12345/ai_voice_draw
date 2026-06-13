import httpx
import asyncio
from typing import List, Dict, Callable, Any
from app.config import get_settings
from app.errors import AIServiceError


class AIService:
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.ALIYUN_API_KEY
        self.chat_model = settings.QWEN_CHAT_MODEL
        self.image_model = settings.QWEN_IMAGE_MODEL
        self.max_retries = settings.MAX_RETRIES
        self.timeout = settings.TIMEOUT
        self.client = httpx.AsyncClient(timeout=self.timeout)
        self.base_url = "https://dashscope.aliyuncs.com/api/v1"

    async def chat_completion(self, messages: List[Dict], model: str = None) -> str:
        """调用对话模型"""
        model = model or self.chat_model

        async def request():
            response = await self.client.post(
                f"{self.base_url}/services/aigc/text-generation/generation",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "input": {"messages": messages},
                    "parameters": {"result_format": "message"}
                }
            )
            response.raise_for_status()
            data = response.json()

            if data.get("code"):
                raise AIServiceError(f"API错误: {data.get('message', '未知错误')}")

            return data["output"]["choices"][0]["message"]["content"]

        return await self._retry_request(request)

    async def generate_image(self, prompt: str, model: str = None, size: str = "1024*1024") -> str:
        """生成图像返回URL"""
        model = model or self.image_model
        print(f"\n[图像生成] 开始 - model: {model}, size: {size}")
        print(f"[图像生成] prompt: {prompt[:100]}...")

        async def request():
            print(f"[图像生成] 发送请求到阿里云...")
            response = await self.client.post(
                f"{self.base_url}/services/aigc/text2image/image-synthesis",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "X-DashScope-Async": "enable"
                },
                json={
                    "model": model,
                    "input": {"prompt": prompt},
                    "parameters": {"size": size, "n": 1}
                }
            )
            print(f"[图像生成] HTTP状态码: {response.status_code}")
            response.raise_for_status()
            data = response.json()
            print(f"[图像生成] 响应: {data}")

            if data.get("code"):
                raise AIServiceError(f"生图API错误: {data.get('message', '未知错误')}")

            task_id = data["output"]["task_id"]
            print(f"[图像生成] 任务ID: {task_id}, 开始轮询...")
            return await self._poll_image_result(task_id)

        return await self._retry_request(request)

    async def _poll_image_result(self, task_id: str) -> str:
        """轮询图像生成结果"""
        for i in range(60):
            response = await self.client.get(
                f"{self.base_url}/tasks/{task_id}",
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
            response.raise_for_status()
            data = response.json()

            status = data["output"]["task_status"]
            print(f"[轮询 {i+1}/60] 状态: {status}")

            if status == "SUCCEEDED":
                image_url = data["output"]["results"][0]["url"]
                print(f"[轮询] 成功！图像URL: {image_url}")
                return image_url
            elif status == "FAILED":
                error_msg = data['output'].get('message', '未知错误')
                print(f"[轮询] 失败: {error_msg}")
                raise AIServiceError(f"图像生成失败: {error_msg}")

            await asyncio.sleep(2)

        print(f"[轮询] 超时！已轮询60次")
        raise AIServiceError("图像生成超时")

    async def _retry_request(self, func: Callable, max_retries: int = None) -> Any:
        """重试机制（指数退避）"""
        max_retries = max_retries or self.max_retries
        last_error = None

        for attempt in range(max_retries):
            try:
                return await func()
            except (httpx.HTTPError, AIServiceError) as e:
                last_error = e
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    await asyncio.sleep(wait_time)

        raise AIServiceError(f"请求失败，已重试{max_retries}次: {str(last_error)}")

    async def close(self):
        """关闭HTTP客户端"""
        await self.client.aclose()
