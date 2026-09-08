from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates



router = APIRouter(prefix="/chat")
templates = Jinja2Templates(directory="templates")


@router.get("/")
async def chat(request: Request):
    return NotImplemented