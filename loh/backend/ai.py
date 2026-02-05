import os
import logging
from dotenv import load_dotenv

_DOTENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=_DOTENV_PATH, override=True, encoding="utf-8-sig")

_key = os.getenv("GROQ_API_KEY")
logging.warning(
    "dotenv loaded from %s (exists=%s). GROQ_API_KEY present=%s len=%s",
    _DOTENV_PATH,
    os.path.exists(_DOTENV_PATH),
    bool(_key),
    (len(_key) if _key else 0),
)

import json
import urllib.request
import urllib.error
import re
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


router = APIRouter(prefix="/ai", tags=["ai"])


def _is_greeting(text: str) -> bool:
    normalized = " ".join((text or "").lower().split()).strip()
    if not normalized:
        return False

    normalized = re.sub(r"[^\w\s]", "", normalized)
    if not normalized:
        return False

    first = normalized.split(" ", 1)[0]
    return first in {"hai", "halo", "hi", "hello", "hei", "hey", "hallo"}


def _product_detail_category(text: str) -> Optional[str]:
    normalized = " ".join((text or "").lower().split()).strip()
    if not normalized:
        return None

    buckets = {
        "material": {"bahan", "material"},
        "size": {"ukuran", "size"},
        "color": {"warna"},
        "variant": {"varian"},
        "spec": {"spesifikasi", "spec", "detail produk"},
        "authenticity": {"original", "ori"},
        "warranty": {"garansi"},
        "stock": {"stok", "ready", "preorder", "pre order"},
        "expiry": {"expired", "kadaluarsa"},
    }

    for category, keys in buckets.items():
        if any(k in normalized for k in keys):
            return category
    return None


class AiSupportRequest(BaseModel):
    message: str


class AiSupportResponse(BaseModel):
    answer: str


APP_SUPPORT_SYSTEM_PROMPT = (
    "Kamu adalah asisten customer support untuk aplikasi marketplace . "
    "Tugasmu membantu user memahami aplikasi dan menyelesaikan masalah. "
    "Jawab dalam Bahasa Indonesia yang natural, ringkas, dan jelas. "
    "Jika user bertanya di luar konteks aplikasi, arahkan kembali ke topik aplikasi. "
    "Jika butuh data yang tidak tersedia, tanyakan klarifikasi (mis. email akun, order id).\n\n"
    "Jangan awali jawaban dengan kalimat seperti 'Selamat datang di aplikasi marketplace kami!'.\n\n"
    "Topik yang bisa kamu bantu:\n"
    "- Fitur aplikasi (login, signup, dashboard, chat AI rekomendasi).\n"
    "- Produk: kamu tidak memberikan detail spesifik produk (spesifikasi/ukuran/warna/stok/garansi). Untuk detail produk, arahkan user untuk bertanya langsung ke seller/penjual.\n"
    "- Masalah pembelian/pesanan: status pesanan, pembayaran gagal, refund (beri langkah umum dan apa yang perlu dicek).\n"
    "- Akun: cara ganti email, lupa password, logout (beri langkah dan peringatan keamanan).\n\n"
    "Aturan:\n"
    "- Jangan minta data sensitif seperti password/OTP.\n"
    "- Jangan klaim ada fitur yang belum disebut user.\n"
)


def _call_groq(prompt: str, system_prompt: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")

    model = os.getenv("GROQ_MODEL") or "llama3-8b-8192"
    base_url = os.getenv("GROQ_BASE_URL") or "https://api.groq.com/openai/v1"
    url = f"{base_url.rstrip('/')}/chat/completions"

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_tokens": 350,
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "Mozilla/5.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8") if hasattr(e, "read") else ""
        except Exception:
            body = ""
        if e.code == 429:
            raise HTTPException(status_code=429, detail=f"Groq quota/rate limit (429): {body}")
        raise HTTPException(status_code=502, detail=f"Groq HTTPError: {e.code} {body}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq request failed: {str(e)}")

    data = json.loads(raw)
    try:
        return data["choices"][0]["message"]["content"].strip()
    except Exception:
        raise HTTPException(status_code=502, detail="Groq response format unexpected")


@router.post("/support", response_model=AiSupportResponse)
def ai_support(payload: AiSupportRequest):
    message = (payload.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    if _is_greeting(message):
        return AiSupportResponse(
            answer=(
                "Halo! Bisa saya bantu? Kamu bisa tanya tentang fitur aplikasi, produk, masalah pembelian/pesanan, "
                "atau pengaturan akun seperti ganti email."
            )
        )

    category = _product_detail_category(message)
    if category:
        detail_hint = "detail produk"
        if category == "material":
            detail_hint = "detail bahan/material"
        elif category == "size":
            detail_hint = "detail ukuran/size"
        elif category == "color":
            detail_hint = "detail warna"
        elif category == "variant":
            detail_hint = "detail varian"
        elif category == "spec":
            detail_hint = "detail spesifikasi"
        elif category == "authenticity":
            detail_hint = "info original/keaslian"
        elif category == "warranty":
            detail_hint = "detail garansi"
        elif category == "stock":
            detail_hint = "info stok/ready/preorder"
        elif category == "expiry":
            detail_hint = "info expired/kadaluarsa"

        return AiSupportResponse(
            answer=(
                f"Untuk {detail_hint}, sebaiknya kamu tanyakan langsung ke seller/penjual di halaman produk ya.\n\n"
                "Kalau kamu mau, aku bisa bantu cara pesan produk, cara bayar, atau cek status pesanan di aplikasi."
            )
        )

    answer = _call_groq(message, APP_SUPPORT_SYSTEM_PROMPT).strip()
    answer = answer.replace("Selamat datang di aplikasi marketplace kami!", "").lstrip(" \n\t")
    return AiSupportResponse(answer=answer)
