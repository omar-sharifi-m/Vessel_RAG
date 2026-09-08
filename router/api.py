from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates



router = APIRouter(prefix="/api")
templates = Jinja2Templates(directory="templates")


@router.get("/chat")
async def chat(request: Request):
    return "Heelo"