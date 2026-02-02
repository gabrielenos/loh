
import os
import json
import urllib.request
import urllib.error
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, Product


router = APIRouter(prefix="/ai", tags=["ai"])


class AiModelInfo(BaseModel):
    name: str
    supported_generation_methods: list[str] = []


class AiModelsResponse(BaseModel):
    api_versions_tried: list[str]
    models: list[AiModelInfo]


class AiProductRequest(BaseModel):
    intent: Optional[str] = None


class AiProductResponse(BaseModel):
    product_id: int
    title: str
    answer: str


def _call_gemini(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set")

    model = os.getenv("GEMINI_MODEL") or "gemini-1.5-flash-latest"
    if model.startswith("models/"):
        model = model.split("/", 1)[1]
    api_version = os.getenv("GEMINI_API_VERSION")
    versions_to_try = [api_version] if api_version else ["v1beta", "v1"]

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 350,
        },
    }

    last_http_error = None
    last_http_body = ""
    for ver in versions_to_try:
        url = (
            f"https://generativelanguage.googleapis.com/{ver}/models/"
            f"{model}:generateContent?key={api_key}"
        )
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
            break
        except urllib.error.HTTPError as e:
            last_http_error = e
            last_http_body = e.read().decode("utf-8") if hasattr(e, "read") else ""
            raw = ""

            if e.code == 429:
                raise HTTPException(
                    status_code=429,
                    detail=(
                        f"Gemini quota/rate limit (429): {last_http_body} "
                        "(Solusi: cek quota/billing di Google AI Studio/Cloud, atau tunggu sesuai retryDelay.)"
                    ),
                )

            continue
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Gemini request failed: {str(e)}")

    if not raw:
        if last_http_error is not None:
            raise HTTPException(
                status_code=502,
                detail=(
                    f"Gemini HTTPError: {last_http_error.code} {last_http_body} "
                    "(Tip: buka /ai/models untuk lihat model yang tersedia, lalu set GEMINI_MODEL.)"
                ),
            )
        raise HTTPException(status_code=502, detail="Gemini request failed")

    data = json.loads(raw)
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        raise HTTPException(status_code=502, detail="Gemini response format unexpected")


@router.get("/models", response_model=AiModelsResponse)
def list_gemini_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set")

    api_version = os.getenv("GEMINI_API_VERSION")
    versions_to_try = [api_version] if api_version else ["v1beta", "v1"]

    all_models: list[AiModelInfo] = []
    for ver in versions_to_try:
        url = f"https://generativelanguage.googleapis.com/{ver}/models?key={api_key}"
        req = urllib.request.Request(url, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            for m in data.get("models", []) or []:
                name = m.get("name")
                if name:
                    methods = m.get("supportedGenerationMethods") or []
                    all_models.append(
                        AiModelInfo(
                            name=str(name),
                            supported_generation_methods=[str(x) for x in methods if x is not None],
                        )
                    )
        except urllib.error.HTTPError:
            continue
        except Exception:
            continue

    unique: dict[str, AiModelInfo] = {}
    for m in all_models:
        existing = unique.get(m.name)
        if existing is None:
            unique[m.name] = m
        else:
            merged = sorted(
                list(
                    {
                        *existing.supported_generation_methods,
                        *m.supported_generation_methods,
                    }
                )
            )
            unique[m.name] = AiModelInfo(name=m.name, supported_generation_methods=merged)

    models_sorted = [unique[k] for k in sorted(unique.keys())]
    if not models_sorted:
        raise HTTPException(status_code=502, detail="Could not list models for this API key")

    return AiModelsResponse(api_versions_tried=versions_to_try, models=models_sorted)


@router.post("/product/{product_id}", response_model=AiProductResponse)
def ai_product(product_id: int, payload: AiProductRequest, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    intent = (payload.intent or "").strip()
    description = product.description or ""
    details = product.details_json or "{}"

    prompt = (
        "Kamu adalah asisten marketplace. Jawab dalam Bahasa Indonesia, ringkas dan jelas. "
        "Gunakan data produk di bawah ini sebagai sumber utama. Jangan mengarang detail teknis yang tidak ada.\n\n"
        f"Nama Produk: {product.title}\n"
        f"Deskripsi: {description}\n"
        f"Detail(JSON): {details}\n\n"
        "Tugas:\n"
        "1) Ringkas produk ini (2-3 kalimat).\n"
        "2) Sebutkan 3 poin kelebihan.\n"
        "3) Sebutkan 1-2 hal yang perlu diperhatikan (mis. peringatan/cocok_untuk).\n"
    )

    if intent:
        prompt += f"\nKebutuhan user: {intent}\n"

    answer = _call_gemini(prompt)
    return AiProductResponse(product_id=product.id, title=product.title, answer=answer)

