from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from models.customer import Customer
from database import SessionLocal

router = APIRouter(prefix="/auth", tags=["auth"])

# Security config
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class CustomerCreate(BaseModel):
    email: str
    phone: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class CustomerResponse(BaseModel):
    email: str
    phone: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_verified: bool

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def authenticate_user(email: str, password: str):
    db = SessionLocal()
    try:
        user = db.query(Customer).filter(Customer.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            return False
        return user
    finally:
        db.close()

@router.post("/register", response_model=CustomerResponse)
async def register(customer: CustomerCreate):
    db = SessionLocal()
    try:
        db_customer = Customer(
            email=customer.email,
            phone=customer.phone,
            first_name=customer.first_name,
            last_name=customer.last_name,
            password_hash=get_password_hash(customer.password)
        )
        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)
        return db_customer
    finally:
        db.close()

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db = SessionLocal()
    try:
        user = db.query(Customer).filter(Customer.email == email).first()
        if user is None:
            raise credentials_exception
        return user
    finally:
        db.close()