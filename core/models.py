from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    model: str = "qwen3:8b"
    context_window: int = 8192


class ChatResponse(BaseModel):
    answer: str