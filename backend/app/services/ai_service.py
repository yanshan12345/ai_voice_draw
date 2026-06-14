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
        self.current_image_task: str | None = None  # 跟踪当前生图任务

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

        # 取消之前的任务
        if self.current_image_task:
            print(f"[图像生成] 取消之前的任务: {self.current_image_task}")
            self.current_image_task = None

        print(f"\n[图像生成] 开始 - model: {model}, size: {size}")
        print(f"[图像生成] prompt: {prompt[:100]}...")

        try:
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
            self.current_image_task = task_id
            print(f"[图像生成] 任务ID: {task_id}, 开始轮询...")

            result = await self._poll_image_result(task_id)
            self.current_image_task = None
            return result

        except Exception as e:
            self.current_image_task = None
            raise AIServiceError(f"图像生成失败: {str(e)}")

    async def _poll_image_result(self, task_id: str) -> str:
        """轮询图像生成结果"""
        max_polls = 100  # 增加到100次
        poll_interval = 3  # 3秒间隔，总共300秒（5分钟）

        print(f"[轮询] 开始轮询任务 {task_id}，最多{max_polls}次，间隔{poll_interval}秒")

        for i in range(max_polls):
            # 检查任务是否被取消
            if self.current_image_task != task_id:
                print(f"[轮询] 任务被取消: {task_id}")
                raise AIServiceError("任务已取消")

            try:
                response = await self.client.get(
                    f"{self.base_url}/tasks/{task_id}",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                print(f"[轮询 {i+1}/{max_polls}] HTTP状态: {response.status_code}")
                response.raise_for_status()
                data = response.json()

                # 打印完整响应用于调试
                print(f"[轮询 {i+1}/{max_polls}] 完整响应: {data}")

                # 检查响应结构
                if "output" not in data:
                    print(f"[轮询] 错误：响应中没有output字段")
                    raise AIServiceError(f"API响应格式错误: {data}")

                status = data["output"].get("task_status", "UNKNOWN")
                print(f"[轮询 {i+1}/{max_polls}] 状态: {status}")

                if status == "SUCCEEDED":
                    results = data["output"].get("results")
                    if not results or len(results) == 0:
                        raise AIServiceError("生成成功但没有返回图像")
                    image_url = results[0]["url"]
                    print(f"[轮询] 成功！图像URL: {image_url}")
                    return image_url

                elif status == "FAILED":
                    error_msg = data['output'].get('message', '未知错误')
                    error_code = data.get('code', 'UNKNOWN')
                    print(f"[轮询] 失败 - 错误码: {error_code}, 消息: {error_msg}")
                    raise AIServiceError(f"图像生成失败 [{error_code}]: {error_msg}")

                elif status in ["PENDING", "RUNNING"]:
                    print(f"[轮询] 任务进行中，{poll_interval}秒后重试...")
                    await asyncio.sleep(poll_interval)

                else:
                    print(f"[轮询] 未知状态: {status}，继续轮询...")
                    await asyncio.sleep(poll_interval)

            except httpx.HTTPStatusError as e:
                print(f"[轮询] HTTP错误 {e.response.status_code}: {e.response.text}")
                if e.response.status_code == 401:
                    raise AIServiceError("API密钥无效或已过期")
                elif e.response.status_code == 404:
                    raise AIServiceError(f"任务不存在: {task_id}")
                await asyncio.sleep(poll_interval)

            except httpx.HTTPError as e:
                print(f"[轮询] 网络错误: {type(e).__name__} - {e}")
                await asyncio.sleep(poll_interval)

            except KeyError as e:
                print(f"[轮询] 响应解析错误: 缺少字段 {e}")
                print(f"[轮询] 原始数据: {data}")
                raise AIServiceError(f"API响应格式异常: 缺少{e}")

        print(f"[轮询] 超时！已轮询{max_polls}次，共{max_polls * poll_interval}秒")
        raise AIServiceError(f"图像生成超时（{max_polls * poll_interval}秒），请检查：1) API配额 2) 网络连接 3) prompt是否合规")

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
