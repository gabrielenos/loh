import os
from dotenv import load_dotenv

load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), ".env"),
    override=True,
    encoding="utf-8-sig",
)

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import timedelta
from typing import List, Optional

from pydantic import BaseModel

from ai import router as ai_router

from database import engine, Base, SessionLocal, get_db, User, Product
from auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_current_user,
    Token,
    UserCreate,
    UserOut,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

# Initialize database tables
Base.metadata.create_all(bind=engine)


def _ensure_user_profile_columns():
    # Best-effort schema alignment for development environments.
    # Avoids requiring manual migrations just to store phone/address.
    try:
        with engine.connect() as conn:
            # phone
            phone_exists = conn.execute(
                text(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone'"
                )
            ).scalar()
            if not phone_exists:
                conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL"))

            # address
            address_exists = conn.execute(
                text(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address'"
                )
            ).scalar()
            if not address_exists:
                conn.execute(text("ALTER TABLE users ADD COLUMN address TEXT NULL"))

            conn.commit()
    except Exception:
        # If this fails, the app can still run; user can add columns manually.
        pass


_ensure_user_profile_columns()

app = FastAPI()

app.include_router(ai_router)

# CORS configuration
from fastapi.middleware.cors import CORSMiddleware
origins = ["*"]  # Allow all origins for development, restrict in production

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/register", response_model=UserOut)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/users/me", response_model=UserOut)
async def read_users_me(current_user: UserOut = Depends(get_current_user)):
    return current_user


class UserUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None


@app.put("/users/me", response_model=UserOut)
async def update_users_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.address is not None:
        current_user.address = payload.address
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@app.get("/")
def read_root():
    return {"message": "Welcome to the Marketplace Backend"}


class ProductOut(BaseModel):
    id: int
    title: str
    price: float
    rating: Optional[float] = None
    reviews: Optional[int] = None
    ai_recommended: bool = False
    description: Optional[str] = None
    details_json: Optional[str] = None

    class Config:
        from_attributes = True


@app.get("/products", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.asc()).all()


@app.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


class ProductCreate(BaseModel):
    title: str
    price: float
    rating: Optional[float] = None
    reviews: Optional[int] = None
    ai_recommended: bool = False
    description: Optional[str] = None
    details_json: Optional[str] = None


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    price: Optional[float] = None
    rating: Optional[float] = None
    reviews: Optional[int] = None
    ai_recommended: Optional[bool] = None
    description: Optional[str] = None
    details_json: Optional[str] = None


@app.post("/products", response_model=ProductOut)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(
        title=payload.title,
        price=payload.price,
        rating=payload.rating,
        reviews=payload.reviews,
        ai_recommended=payload.ai_recommended,
        description=payload.description,
        details_json=payload.details_json,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@app.patch("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.add(product)
    db.commit()
    db.refresh(product)
    return product
