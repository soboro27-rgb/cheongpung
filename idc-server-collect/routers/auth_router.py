from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from config import templates
import bcrypt
from datetime import datetime

router = APIRouter()


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    if request.session.get("user_id"):
        return RedirectResponse("/")
    return templates.TemplateResponse(request, "login.html", {"error": ""})


@router.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    login_id = str(form.get("login_id", "")).strip()
    password = str(form.get("password", ""))

    user = db.query(models.User).filter(
        models.User.login_id == login_id,
        models.User.is_active == True,
    ).first()

    action = "login_failed"
    if user and _verify(password, user.password_hash):
        action = "login_success"
        request.session["user_id"]   = user.id
        request.session["login_id"]  = user.login_id
        request.session["name"]      = user.name
        request.session["role"]      = user.role.value
        request.session["dealer_id"]        = user.dealer_id
        request.session["dealer_name"]      = user.dealer.name if user.dealer else ""
        request.session["dealer_fee_type"]  = user.dealer.fee_type.value if user.dealer else ""
        request.session["dealer_fee_value"] = user.dealer.fee_value if user.dealer else 0
        request.session["customer_id"]   = user.customer_id
        request.session["customer_name"] = user.customer.name if user.customer else ""
        user.last_login = datetime.now()
        db.commit()

    # 로그인 이력
    db.add(models.LoginLog(
        user_id=user.id if (user and action == "login_success") else None,
        login_id=login_id,
        role=user.role.value if (user and action == "login_success") else "",
        action=action,
        ip_address=request.client.host if request.client else "",
        user_agent=request.headers.get("user-agent", "")[:300],
    ))
    db.commit()

    if action == "login_failed":
        return templates.TemplateResponse(request, "login.html", {"error": "아이디 또는 비밀번호가 올바르지 않습니다."},
            status_code=401,
        )
    return RedirectResponse("/", status_code=302)


@router.get("/change-password", response_class=HTMLResponse)
def change_password_form(request: Request):
    if not request.session.get("user_id"):
        return RedirectResponse("/login", status_code=302)
    return templates.TemplateResponse(request, "change_password.html",
        {"session": request.session, "error": "", "success": False})


@router.post("/change-password")
async def change_password(request: Request, db: Session = Depends(get_db)):
    if not request.session.get("user_id"):
        return RedirectResponse("/login", status_code=302)
    form = await request.form()
    current_pw  = str(form.get("current_password", ""))
    new_pw      = str(form.get("new_password", "")).strip()
    confirm_pw  = str(form.get("confirm_password", "")).strip()

    user = db.query(models.User).filter(models.User.id == request.session["user_id"]).first()
    if not user:
        return RedirectResponse("/login", status_code=302)

    if not _verify(current_pw, user.password_hash):
        return templates.TemplateResponse(request, "change_password.html",
            {"session": request.session, "error": "현재 비밀번호가 올바르지 않습니다.", "success": False})
    if len(new_pw) < 6:
        return templates.TemplateResponse(request, "change_password.html",
            {"session": request.session, "error": "새 비밀번호는 6자 이상이어야 합니다.", "success": False})
    if new_pw != confirm_pw:
        return templates.TemplateResponse(request, "change_password.html",
            {"session": request.session, "error": "새 비밀번호가 일치하지 않습니다.", "success": False})

    user.password_hash = _hash(new_pw)
    db.commit()
    return templates.TemplateResponse(request, "change_password.html",
        {"session": request.session, "error": "", "success": True})


@router.get("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if user_id:
        db.add(models.LoginLog(
            user_id=user_id,
            login_id=request.session.get("login_id", ""),
            role=request.session.get("role", ""),
            action="logout",
            ip_address=request.client.host if request.client else "",
            user_agent=request.headers.get("user-agent", "")[:300],
        ))
        db.commit()
    request.session.clear()
    return RedirectResponse("/login", status_code=302)
