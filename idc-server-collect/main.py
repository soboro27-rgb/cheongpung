import os
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse, JSONResponse
from pathlib import Path
from database import engine
import models

models.Base.metadata.create_all(bind=engine)

from routers import auth_router, wm_router, dealer_router, customer_router

app = FastAPI(title="IDC 서버 수거 플랫폼")
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "idc-server-collect-2024-secret"))

STATIC_DIR = Path(__file__).resolve().parent / "static"
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

TMPL_DIR = Path(__file__).resolve().parent / "templates"
templates = Jinja2Templates(directory=str(TMPL_DIR))

app.include_router(auth_router.router)
app.include_router(wm_router.router,       prefix="/wm")
app.include_router(dealer_router.router,   prefix="/dealer")
app.include_router(customer_router.router, prefix="/customer")


@app.get("/health")
def health():
    return JSONResponse({"status": "ok"})


@app.get("/intro")
def intro(request: Request):
    return templates.TemplateResponse(request, "intro.html", {})


@app.get("/intro/dealer")
def intro_dealer(request: Request):
    return templates.TemplateResponse(request, "intro_dealer.html", {})


@app.get("/intro/customer")
def intro_customer(request: Request):
    return templates.TemplateResponse(request, "intro_customer.html", {})


@app.get("/")
def root(request: Request):
    if not request.session.get("user_id"):
        return RedirectResponse("/login")
    role = request.session.get("role", "")
    if role in ("super_admin", "wm_collector", "wm_inspector"):
        return RedirectResponse("/wm/dashboard")
    if role in ("dealer_admin", "dealer_staff"):
        return RedirectResponse("/dealer/dashboard")
    return RedirectResponse("/customer/dashboard")
