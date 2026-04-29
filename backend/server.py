"""Lifelong Health Companion - Backend API."""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Response, Request, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import jwt
import bcrypt
import httpx
import requests
import io
import asyncio
import secrets as _secrets
import resend
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta, date

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS = int(os.environ.get("JWT_EXPIRE_HOURS", "168"))
NVCF_API_KEY = os.environ.get("NVCF_API_KEY", "")
NIM_API_URL = os.environ.get("NIM_API_URL", "https://integrate.api.nvidia.com/v1")
NIM_MODEL = os.environ.get("NIM_MODEL", "meta/llama-3.1-8b-instruct")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
APP_NAME = os.environ.get("APP_NAME", "lifelong-health")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_AUTH_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Module-level storage key (set once at startup)
storage_key: Optional[str] = None

def init_storage() -> Optional[str]:
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_LLM_KEY:
        return None
    try:
        r = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=15)
        r.raise_for_status()
        storage_key = r.json()["storage_key"]
        return storage_key
    except Exception as e:
        logging.error(f"storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(503, "Storage not available")
    r = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=60,
    )
    r.raise_for_status()
    return r.json()

def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    if not key:
        raise HTTPException(503, "Storage not available")
    r = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=30)
    r.raise_for_status()
    return r.content, r.headers.get("Content-Type", "application/octet-stream")

app = FastAPI(title="Lifelong Health Companion")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------- Models ----------------
class SignupReq(BaseModel):
    email: EmailStr
    password: str
    role: Literal["parent", "individual"]
    name: Optional[str] = None
    dob: Optional[str] = None  # YYYY-MM-DD
    gender: Optional[Literal["male", "female", "other"]] = None

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class ProfileCreate(BaseModel):
    name: str
    dob: str  # YYYY-MM-DD
    gender: Literal["male", "female", "other"]
    is_child: bool = True

class ProfileOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: Optional[str] = None
    name: str
    dob: str
    gender: str
    is_child: bool
    puberty_started: bool
    age: int
    stage: str
    has_photo: bool = False
    created_at: str

class HealthLogCreate(BaseModel):
    type: Literal["sickness", "visit", "vaccine", "note"]
    title: str
    description: Optional[str] = ""
    date: str  # YYYY-MM-DD

class HealthLogOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    profile_id: str
    type: str
    title: str
    description: str
    date: str
    created_at: str

class PubertyUpdate(BaseModel):
    puberty_started: bool

class AIAskReq(BaseModel):
    question: str
    profile_id: Optional[str] = None
    age: int
    gender: str
    stage: Literal["child", "teen", "adult"]
    context_type: Literal["parent", "teen", "adult"]
    health_score: Optional[int] = None

# ---------------- Helpers ----------------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def make_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def _resolve_user(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    # JWT
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        u = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if u:
            return u
    except jwt.PyJWTError:
        pass
    # Emergent session_token
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if sess:
        exp = sess.get("expires_at")
        if isinstance(exp, str):
            exp = datetime.fromisoformat(exp)
        if exp and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp and exp < datetime.now(timezone.utc):
            return None
        u = await db.users.find_one({"id": sess["user_id"]}, {"_id": 0})
        if u:
            return u
    return None

async def get_user(request: Request, authorization: Optional[str] = Header(None)) -> dict:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if not token:
        token = request.cookies.get("session_token")
    user = await _resolve_user(token)
    if not user:
        raise HTTPException(401, "Invalid or missing token")
    return user

def compute_age(dob_str: str) -> int:
    try:
        d = datetime.strptime(dob_str, "%Y-%m-%d").date()
    except Exception:
        return 0
    today = date.today()
    return today.year - d.year - ((today.month, today.day) < (d.month, d.day))

def compute_stage(age: int, puberty_started: bool) -> str:
    if age >= 18:
        return "adult"
    if age >= 11 or puberty_started:
        return "teen"
    return "child"

def compute_health_score(sickness_count: int) -> int:
    return max(0, 100 - sickness_count * 10)

def health_reminder(score: int) -> dict:
    if score >= 80:
        return {"label": "Doing great", "tone": "good", "message": "Keep up the healthy habits — sleep well, eat varied food, and stay active."}
    if score >= 60:
        return {"label": "Mild concern", "tone": "warn", "message": "A few sicknesses recently. Hydrate, rest, and watch for fever or persistent symptoms."}
    if score >= 40:
        return {"label": "Needs attention", "tone": "warn", "message": "You've been sick often. Consider a check-up to rule out an underlying issue."}
    return {"label": "Please see a doctor", "tone": "alert", "message": "Frequent illness in a short window. Book a doctor visit and bring your health log along."}

def profile_out(doc: dict) -> dict:
    age = compute_age(doc["dob"])
    return {
        "id": doc["id"],
        "user_id": doc.get("user_id"),
        "name": doc["name"],
        "dob": doc["dob"],
        "gender": doc["gender"],
        "is_child": doc.get("is_child", True),
        "puberty_started": doc.get("puberty_started", False),
        "age": age,
        "stage": compute_stage(age, doc.get("puberty_started", False)),
        "has_photo": bool(doc.get("photo_path")),
        "created_at": doc.get("created_at", ""),
    }

async def assert_profile_access(profile_id: str, user: dict) -> dict:
    prof = await db.profiles.find_one({"id": profile_id}, {"_id": 0})
    if not prof:
        raise HTTPException(404, "Profile not found")
    age = compute_age(prof["dob"])
    stage = compute_stage(age, prof.get("puberty_started", False))
    # If profile is an adult (18+), only the profile owner (user_id match) may access details
    if stage == "adult" and prof.get("user_id") != user["id"]:
        raise HTTPException(403, "Adult profile – parent access removed")
    # Parent access: profile.parent_user_id must match
    if prof.get("user_id") == user["id"]:
        return prof
    if prof.get("parent_user_id") == user["id"]:
        return prof
    raise HTTPException(403, "Not your profile")

# ---------------- Auth ----------------
@api.post("/auth/signup")
async def signup(req: SignupReq):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    user = {
        "id": uid,
        "email": req.email.lower(),
        "password_hash": hash_pw(req.password),
        "role": req.role,
        "created_at": now,
    }
    await db.users.insert_one(user)
    # If individual, auto-create adult profile
    if req.role == "individual":
        if not (req.name and req.dob and req.gender):
            raise HTTPException(400, "Individual signup requires name, dob, gender")
        prof = {
            "id": str(uuid.uuid4()),
            "user_id": uid,
            "parent_user_id": None,
            "name": req.name,
            "dob": req.dob,
            "gender": req.gender,
            "is_child": False,
            "puberty_started": True,
            "created_at": now,
        }
        await db.profiles.insert_one(prof)
    token = make_token(uid, req.email.lower())
    return {"token": token, "user": {"id": uid, "email": req.email.lower(), "role": req.role}}

@api.post("/auth/login")
async def login(req: LoginReq):
    user = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if not user or not verify_pw(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = make_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "role": user["role"]}}

@api.get("/auth/me")
async def me(user: dict = Depends(get_user)):
    return {
        "id": user["id"], "email": user["email"], "role": user.get("role"),
        "source": user.get("source", "password"), "picture": user.get("picture"),
    }

# ---------------- Google / Emergent OAuth ----------------
class GoogleSessionReq(BaseModel):
    session_id: str

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api.post("/auth/google-session")
async def google_session(req: GoogleSessionReq, response: Response):
    try:
        async with httpx.AsyncClient(timeout=20.0) as http:
            r = await http.get(EMERGENT_AUTH_SESSION_URL, headers={"X-Session-ID": req.session_id})
        if r.status_code != 200:
            raise HTTPException(401, "Invalid Google session")
        data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("emergent session-data failed")
        raise HTTPException(502, f"Auth provider error: {e}")

    email = (data.get("email") or "").lower()
    if not email:
        raise HTTPException(400, "No email returned by provider")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    now = datetime.now(timezone.utc).isoformat()
    if not user:
        uid = str(uuid.uuid4())
        user = {
            "id": uid, "email": email, "password_hash": None,
            "role": None, "source": "google",
            "picture": data.get("picture"), "name": data.get("name"),
            "created_at": now,
        }
        await db.users.insert_one(user)
    else:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"picture": data.get("picture") or user.get("picture"),
                       "name": data.get("name") or user.get("name")}}
        )
        user["picture"] = data.get("picture") or user.get("picture")

    session_token = data.get("session_token") or str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user["id"], "session_token": session_token,
        "expires_at": expires_at.isoformat(), "created_at": now,
    })
    response.set_cookie(
        key="session_token", value=session_token,
        max_age=7 * 24 * 3600, path="/",
        httponly=True, secure=True, samesite="none",
    )
    return {
        "token": session_token,
        "user": {"id": user["id"], "email": user["email"], "role": user.get("role"),
                 "source": "google", "picture": user.get("picture")},
    }

class RolePickReq(BaseModel):
    role: Literal["parent", "individual"]
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[Literal["male", "female", "other"]] = None

@api.post("/auth/pick-role")
async def pick_role(req: RolePickReq, user: dict = Depends(get_user)):
    if user.get("role"):
        raise HTTPException(400, "Role already set")
    await db.users.update_one({"id": user["id"]}, {"$set": {"role": req.role}})
    if req.role == "individual":
        if not (req.name and req.dob and req.gender):
            raise HTTPException(400, "Individual role requires name, dob, gender")
        await db.profiles.insert_one({
            "id": str(uuid.uuid4()), "user_id": user["id"], "parent_user_id": None,
            "name": req.name, "dob": req.dob, "gender": req.gender,
            "is_child": False, "puberty_started": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return {"ok": True, "role": req.role}

@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}

# ---------------- Forgot password (Resend) ----------------
class ForgotPasswordReq(BaseModel):
    email: EmailStr
    origin: str  # e.g. https://app.example.com — used to build the reset link

class ResetPasswordReq(BaseModel):
    token: str
    new_password: str

def _build_reset_email_html(name: str, link: str) -> str:
    return f"""
<table role=presentation width=100% cellpadding=0 cellspacing=0 style="background:#FDFBF7;font-family:Arial,Helvetica,sans-serif;padding:32px 0">
  <tr><td align=center>
    <table role=presentation width=520 cellpadding=0 cellspacing=0 style="background:#ffffff;border:1px solid #E2DFD6;border-radius:16px;padding:32px;text-align:left">
      <tr><td style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5C7063;padding-bottom:8px">Lifelong Health Companion · India</td></tr>
      <tr><td style="font-size:26px;font-weight:700;color:#1A2E24;padding-bottom:12px;font-family:Georgia,serif">Reset your password</td></tr>
      <tr><td style="font-size:15px;line-height:1.6;color:#1A2E24;padding-bottom:20px">Hi {name or 'there'},<br><br>We received a request to reset the password for your account. Click the button below to choose a new password. This link expires in <strong>30 minutes</strong>.</td></tr>
      <tr><td style="padding-bottom:20px"><a href="{link}" style="background:#2A5948;color:#ffffff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">Reset password</a></td></tr>
      <tr><td style="font-size:12px;color:#5C7063;line-height:1.6">If the button doesn't work, paste this link into your browser:<br><a href="{link}" style="color:#2A5948;word-break:break-all">{link}</a></td></tr>
      <tr><td style="font-size:12px;color:#5C7063;padding-top:24px;border-top:1px solid #E2DFD6;margin-top:24px">If you didn't request this, you can safely ignore this email — your password won't change.</td></tr>
    </table>
  </td></tr>
</table>
""".strip()

@api.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordReq):
    email = req.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    # Always return ok=True so we don't leak which emails exist
    if not user:
        return {"ok": True}
    if user.get("source") == "google" and not user.get("password_hash"):
        # Google-only account; can't reset password (they must use Google login)
        return {"ok": True, "info": "google_only"}

    token = _secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    await db.password_resets.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "token": token,
        "expires_at": expires.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    origin = req.origin.rstrip("/")
    link = f"{origin}/reset-password?token={token}"

    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY missing — skipping email send")
        return {"ok": True, "info": "email_not_configured"}

    params = {
        "from": SENDER_EMAIL,
        "to": [email],
        "subject": "Reset your Lifelong Health Companion password",
        "html": _build_reset_email_html(user.get("name") or email.split("@")[0], link),
    }
    try:
        await asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logger.error(f"Resend send failed: {e}")
        # Still return ok=True so we don't leak existence; surface a server hint via logs
    return {"ok": True}

@api.post("/auth/reset-password")
async def reset_password(req: ResetPasswordReq):
    if len(req.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    rec = await db.password_resets.find_one({"token": req.token, "used": False}, {"_id": 0})
    if not rec:
        raise HTTPException(400, "This reset link is invalid or has already been used.")
    exp = rec.get("expires_at")
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(400, "This reset link has expired. Please request a new one.")
    await db.users.update_one(
        {"id": rec["user_id"]},
        {"$set": {"password_hash": hash_pw(req.new_password), "source": "password"}},
    )
    await db.password_resets.update_one({"token": req.token}, {"$set": {"used": True}})
    # Invalidate any existing sessions
    await db.user_sessions.delete_many({"user_id": rec["user_id"]})
    return {"ok": True}

# ---------------- Account settings ----------------
class ChangePasswordReq(BaseModel):
    current_password: Optional[str] = None
    new_password: str

@api.post("/auth/change-password")
async def change_password(req: ChangePasswordReq, user: dict = Depends(get_user)):
    if len(req.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    if user.get("password_hash"):
        if not req.current_password or not verify_pw(req.current_password, user["password_hash"]):
            raise HTTPException(400, "Current password is incorrect")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_pw(req.new_password), "source": "password"}},
    )
    return {"ok": True}

class ChangeEmailReq(BaseModel):
    new_email: EmailStr
    current_password: Optional[str] = None

@api.post("/auth/change-email")
async def change_email(req: ChangeEmailReq, user: dict = Depends(get_user)):
    new_email = req.new_email.lower()
    if new_email == user["email"]:
        return {"ok": True}
    if user.get("password_hash"):
        if not req.current_password or not verify_pw(req.current_password, user["password_hash"]):
            raise HTTPException(400, "Current password is incorrect")
    if await db.users.find_one({"email": new_email}):
        raise HTTPException(400, "Email already taken")
    await db.users.update_one({"id": user["id"]}, {"$set": {"email": new_email}})
    return {"ok": True, "email": new_email}

# ---------------- Profiles ----------------
@api.get("/profiles")
async def list_profiles(user: dict = Depends(get_user)):
    # Return all profiles user can access
    docs = await db.profiles.find(
        {"$or": [{"user_id": user["id"]}, {"parent_user_id": user["id"]}]},
        {"_id": 0},
    ).to_list(100)
    result = []
    for d in docs:
        p = profile_out(d)
        # Hide adult children from parent
        if p["stage"] == "adult" and d.get("parent_user_id") == user["id"] and d.get("user_id") != user["id"]:
            continue
        result.append(p)
    return result

@api.post("/profiles", response_model=ProfileOut)
async def create_profile(req: ProfileCreate, user: dict = Depends(get_user)):
    if user["role"] != "parent":
        raise HTTPException(403, "Only parent accounts can create child profiles")
    age = compute_age(req.dob)
    if req.is_child and age >= 18:
        raise HTTPException(
            400,
            f"This date makes the child {age} years old. Children must be under 18 to be tracked under a parent account.",
        )
    now = datetime.now(timezone.utc).isoformat()
    prof = {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "parent_user_id": user["id"],
        "name": req.name,
        "dob": req.dob,
        "gender": req.gender,
        "is_child": req.is_child,
        "puberty_started": False,
        "created_at": now,
    }
    await db.profiles.insert_one(prof)
    return profile_out(prof)

@api.get("/profiles/{profile_id}", response_model=ProfileOut)
async def get_profile(profile_id: str, user: dict = Depends(get_user)):
    prof = await assert_profile_access(profile_id, user)
    return profile_out(prof)

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[Literal["male", "female", "other"]] = None

@api.patch("/profiles/{profile_id}", response_model=ProfileOut)
async def update_profile(profile_id: str, req: ProfileUpdate, user: dict = Depends(get_user)):
    prof = await assert_profile_access(profile_id, user)
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if updates:
        await db.profiles.update_one({"id": profile_id}, {"$set": updates})
        prof.update(updates)
    return profile_out(prof)

@api.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: str, user: dict = Depends(get_user)):
    prof = await assert_profile_access(profile_id, user)
    # Only allow parent to delete child profiles, or owner to delete own profile
    if prof.get("user_id") and prof.get("user_id") != user["id"]:
        raise HTTPException(403, "Cannot delete this profile")
    await db.profiles.delete_one({"id": profile_id})
    await db.health_logs.delete_many({"profile_id": profile_id})
    await db.ai_questions.delete_many({"profile_id": profile_id})
    return {"ok": True}

@api.post("/profiles/{profile_id}/photo")
async def upload_profile_photo(profile_id: str, file: UploadFile = File(...), user: dict = Depends(get_user)):
    prof = await assert_profile_access(profile_id, user)
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    raw = await file.read()
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(400, "Image too large (max 5MB)")
    ext = (file.filename or "img").rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
        ext = "jpg"
    storage_path = f"{APP_NAME}/profiles/{profile_id}/{uuid.uuid4()}.{ext}"
    result = put_object(storage_path, raw, file.content_type)
    canonical = result.get("path", storage_path)
    await db.profiles.update_one(
        {"id": profile_id},
        {"$set": {"photo_path": canonical, "photo_content_type": file.content_type}},
    )
    return {"ok": True, "photo_path": canonical}

@api.delete("/profiles/{profile_id}/photo")
async def delete_profile_photo(profile_id: str, user: dict = Depends(get_user)):
    await assert_profile_access(profile_id, user)
    await db.profiles.update_one({"id": profile_id}, {"$unset": {"photo_path": "", "photo_content_type": ""}})
    return {"ok": True}

@api.get("/profiles/{profile_id}/photo")
async def get_profile_photo(profile_id: str, request: Request, auth: Optional[str] = Query(None)):
    # Resolve token from Authorization header, ?auth= query, or cookie (for <img src>)
    token = None
    auth_h = request.headers.get("authorization")
    if auth_h and auth_h.startswith("Bearer "):
        token = auth_h.split(" ", 1)[1]
    if not token and auth:
        token = auth
    if not token:
        token = request.cookies.get("session_token")
    user = await _resolve_user(token)
    if not user:
        raise HTTPException(401, "Invalid or missing token")
    prof = await assert_profile_access(profile_id, user)
    path = prof.get("photo_path")
    if not path:
        raise HTTPException(404, "No photo")
    data, ct = get_object(path)
    return Response(content=data, media_type=prof.get("photo_content_type") or ct)

@api.patch("/profiles/{profile_id}/puberty", response_model=ProfileOut)
async def set_puberty(profile_id: str, req: PubertyUpdate, user: dict = Depends(get_user)):
    prof = await assert_profile_access(profile_id, user)
    await db.profiles.update_one({"id": profile_id}, {"$set": {"puberty_started": req.puberty_started}})
    prof["puberty_started"] = req.puberty_started
    return profile_out(prof)

# ---------------- Health Logs ----------------
@api.get("/profiles/{profile_id}/logs")
async def list_logs(profile_id: str, user: dict = Depends(get_user)):
    await assert_profile_access(profile_id, user)
    logs = await db.health_logs.find({"profile_id": profile_id}, {"_id": 0}).sort("date", -1).to_list(500)
    return logs

@api.post("/profiles/{profile_id}/logs")
async def add_log(profile_id: str, req: HealthLogCreate, user: dict = Depends(get_user)):
    await assert_profile_access(profile_id, user)
    now = datetime.now(timezone.utc).isoformat()
    log = {
        "id": str(uuid.uuid4()),
        "profile_id": profile_id,
        "type": req.type,
        "title": req.title,
        "description": req.description or "",
        "date": req.date,
        "created_at": now,
    }
    await db.health_logs.insert_one(log)
    return {k: v for k, v in log.items() if k != "_id"}

@api.get("/profiles/{profile_id}/stats")
async def profile_stats(profile_id: str, user: dict = Depends(get_user)):
    await assert_profile_access(profile_id, user)
    three_months_ago = (datetime.now(timezone.utc) - timedelta(days=90)).date().isoformat()
    logs = await db.health_logs.find(
        {"profile_id": profile_id, "type": "sickness", "date": {"$gte": three_months_ago}}, {"_id": 0}
    ).to_list(100)
    sickness_count = len(logs)
    score = compute_health_score(sickness_count)
    reminder = health_reminder(score)
    return {
        "sickness_3mo": sickness_count,
        "health_score": score,
        "reminder": reminder,
        "frequently_sick": sickness_count >= 4,
        "reminder_level": "high" if sickness_count >= 4 else "standard",
    }

# ---------------- AI (NVIDIA NIM) ----------------
def build_ai_prompt(ctx: str, age: int, gender: str, stage: str, health_score: Optional[int] = None) -> str:
    role_map = {"parent": "PARENT", "teen": "TEEN", "adult": "ADULT"}
    score_line = ""
    if health_score is not None:
        if health_score >= 80:
            band = "good (very few recent sicknesses)"
        elif health_score >= 60:
            band = "mild concern (a few recent sicknesses)"
        elif health_score >= 40:
            band = "needs attention (frequent recent sicknesses)"
        else:
            band = "alert (very frequent sicknesses; recommend doctor visit)"
        score_line = f"Recent health score: {health_score}/100 — {band}. Tailor advice accordingly. "
    return (
        f"You are a cautious, kind health educator in India. User role: {role_map.get(ctx, 'USER')}. "
        f"Age: {age}. Gender: {gender}. Stage: {stage}. {score_line}"
        "Explain in simple, non-alarming language using short paragraphs. "
        "Use Indian health context where relevant (IAP vaccination schedule, Indian foods, climate). "
        "Do NOT give diagnoses or prescriptions. "
        "Encourage seeing a doctor for serious issues. "
        "Avoid explicit pornographic descriptions; for teen/adult sexuality questions, keep content strictly educational. "
        "Keep the response under 220 words."
    )

@api.post("/ai/ask")
async def ai_ask(req: AIAskReq, user: dict = Depends(get_user)):
    if not NVCF_API_KEY:
        raise HTTPException(500, "NVIDIA NIM API key not configured")
    system_prompt = build_ai_prompt(req.context_type, req.age, req.gender, req.stage, req.health_score)
    payload = {
        "model": NIM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": req.question},
        ],
        "temperature": 0.5,
        "top_p": 0.9,
        "max_tokens": 512,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {NVCF_API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as http:
            r = await http.post(f"{NIM_API_URL}/chat/completions", json=payload, headers=headers)
        if r.status_code != 200:
            logger.error(f"NIM error {r.status_code}: {r.text[:400]}")
            raise HTTPException(502, f"AI service error ({r.status_code})")
        data = r.json()
        answer = data["choices"][0]["message"]["content"].strip()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("NIM call failed")
        raise HTTPException(502, f"AI service error: {str(e)}")

    # Store question/answer for parent/adult contexts only (teen asks are private)
    if req.context_type != "teen":
        entry = {
            "id": str(uuid.uuid4()),
            "profile_id": req.profile_id,
            "asked_by_role": req.context_type,
            "stage_at_time": req.stage,
            "question": req.question,
            "answer": answer,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.ai_questions.insert_one(entry)
    return {
        "answer": answer,
        "disclaimer": "This is educational information, not medical advice. Always consult a qualified doctor for serious concerns.",
    }

@api.get("/profiles/{profile_id}/ai-history")
async def ai_history(profile_id: str, user: dict = Depends(get_user)):
    await assert_profile_access(profile_id, user)
    items = await db.ai_questions.find(
        {"profile_id": profile_id, "asked_by_role": {"$ne": "teen"}}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return items

# ---------------- Vaccination Schedule (India, IAP-inspired, static) ----------------
VACCINATION_SCHEDULE = [
    {"age_months": 0, "label": "At birth", "vaccines": ["BCG", "OPV-0", "Hep B-1"]},
    {"age_months": 1.5, "label": "6 weeks", "vaccines": ["DTwP/DTaP-1", "IPV-1", "Hep B-2", "Hib-1", "Rotavirus-1", "PCV-1"]},
    {"age_months": 2.5, "label": "10 weeks", "vaccines": ["DTwP/DTaP-2", "IPV-2", "Hib-2", "Rotavirus-2", "PCV-2"]},
    {"age_months": 3.5, "label": "14 weeks", "vaccines": ["DTwP/DTaP-3", "IPV-3", "Hib-3", "Rotavirus-3", "PCV-3"]},
    {"age_months": 6, "label": "6 months", "vaccines": ["Influenza-1"]},
    {"age_months": 9, "label": "9 months", "vaccines": ["MMR-1", "Typhoid Conjugate"]},
    {"age_months": 12, "label": "12 months", "vaccines": ["Hep A-1"]},
    {"age_months": 15, "label": "15 months", "vaccines": ["MMR-2", "Varicella-1", "PCV Booster"]},
    {"age_months": 18, "label": "16-18 months", "vaccines": ["DTwP/DTaP Booster-1", "IPV Booster", "Hib Booster", "Hep A-2"]},
    {"age_months": 24, "label": "2 years", "vaccines": ["Typhoid Booster"]},
    {"age_months": 60, "label": "4-6 years", "vaccines": ["DTwP/DTaP Booster-2", "MMR-3", "Varicella-2"]},
    {"age_months": 120, "label": "10-12 years", "vaccines": ["Tdap/Td", "HPV (girls, 2 doses)"]},
    {"age_months": 216, "label": "18+ adult", "vaccines": ["Td/Tdap every 10 years", "Annual Influenza", "HPV catch-up (up to 26)", "COVID-19 boosters"]},
]

ADULT_CHECKUPS = [
    {"title": "General health check", "frequency": "Every 2-3 years (or annually after 40)", "applies_to": "all"},
    {"title": "Blood pressure screening", "frequency": "Annually", "applies_to": "all"},
    {"title": "Blood sugar (fasting / HbA1c)", "frequency": "Every 2-3 years", "applies_to": "all"},
    {"title": "Lipid profile", "frequency": "Every 4-6 years", "applies_to": "all"},
    {"title": "HPV vaccination", "frequency": "Catch-up till 26 years", "applies_to": "female"},
    {"title": "Pap smear / cervical screening", "frequency": "Every 3 years from age 21", "applies_to": "female"},
    {"title": "Breast self-exam", "frequency": "Monthly", "applies_to": "female"},
    {"title": "Testicular self-exam", "frequency": "Monthly", "applies_to": "male"},
    {"title": "Dental check", "frequency": "Every 6 months", "applies_to": "all"},
    {"title": "Eye exam", "frequency": "Every 2 years", "applies_to": "all"},
]

@api.get("/vaccinations/schedule")
async def get_vaccinations():
    return VACCINATION_SCHEDULE

@api.get("/adult/checkups")
async def get_adult_checkups(gender: str = "all"):
    return [c for c in ADULT_CHECKUPS if c["applies_to"] in ("all", gender)]

# ---------------- Seed ----------------
async def seed_if_empty():
    """Seed only the demo accounts. Parents add their own children."""
    if await db.users.find_one({"email": "parent@demo.com"}) is None:
        now = datetime.now(timezone.utc).isoformat()
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": "parent@demo.com",
            "password_hash": hash_pw("demo1234"),
            "role": "parent", "created_at": now,
        })
        logger.info("Seeded parent demo account (no children)")
    if await db.users.find_one({"email": "adult@demo.com"}) is None:
        now = datetime.now(timezone.utc).isoformat()
        aid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": aid, "email": "adult@demo.com",
            "password_hash": hash_pw("demo1234"),
            "role": "individual", "created_at": now,
        })
        await db.profiles.insert_one({
            "id": str(uuid.uuid4()), "user_id": aid, "parent_user_id": None,
            "name": "Priya", "dob": (date.today().replace(year=date.today().year - 27)).isoformat(),
            "gender": "female", "is_child": False, "puberty_started": True, "created_at": now,
        })
        logger.info("Seeded adult demo account (Priya)")

@api.get("/")
async def root():
    return {"ok": True, "app": "Lifelong Health Companion"}

@app.on_event("startup")
async def on_startup():
    try:
        await seed_if_empty()
    except Exception as e:
        logger.error(f"Seed failed: {e}")
    try:
        if init_storage():
            logger.info("Object storage initialized")
        else:
            logger.warning("Object storage not initialized (missing key)")
    except Exception as e:
        logger.error(f"Storage init error: {e}")

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def on_shutdown():
    client.close()
