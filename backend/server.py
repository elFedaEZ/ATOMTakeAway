from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict


# ---------- Configuration ----------
JWT_ALGORITHM = "HS256"
JWT_EXP_MINUTES = 60 * 24 * 7  # 7 days for admin tokens

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="ATOM TakeAway API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Auth helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXP_MINUTES),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(
            credentials.credentials, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Acceso denegado")
    return user


# ---------- Models ----------
class LoginRequest(BaseModel):
    email: str
    password: str


class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    role: str


class LoginResponse(BaseModel):
    token: str
    user: UserPublic


class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    price: float
    category: Literal["burgers", "fries", "coffee", "bakery"]
    image_url: str = ""
    is_available: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MenuItemCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    category: Literal["burgers", "fries", "coffee", "bakery"]
    image_url: str = ""
    is_available: bool = True


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[Literal["burgers", "fries", "coffee", "bakery"]] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None


class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    price: float
    quantity: int


OrderStatus = Literal["pending", "preparing", "ready", "completed", "cancelled"]


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_name: str
    customer_phone: str
    pickup_time: str = ""
    notes: str = ""
    items: List[OrderItem]
    total: float
    status: OrderStatus = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    pickup_time: str = ""
    notes: str = ""
    items: List[OrderItem]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# ---------- Auth routes ----------
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = create_access_token(user["id"], user["email"])
    return LoginResponse(
        token=token,
        user=UserPublic(id=user["id"], email=user["email"], name=user["name"], role=user["role"]),
    )


@api_router.get("/auth/me", response_model=UserPublic)
async def me(admin=Depends(get_current_admin)):
    return UserPublic(**admin)


# ---------- Public menu routes ----------
@api_router.get("/menu", response_model=List[MenuItem])
async def list_menu():
    items = await db.menu_items.find({"is_available": True}, {"_id": 0}).to_list(1000)
    return items


# ---------- Admin menu routes ----------
@api_router.get("/admin/menu", response_model=List[MenuItem])
async def admin_list_menu(admin=Depends(get_current_admin)):
    items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)
    return items


@api_router.post("/admin/menu", response_model=MenuItem)
async def admin_create_menu(payload: MenuItemCreate, admin=Depends(get_current_admin)):
    item = MenuItem(**payload.model_dump())
    doc = item.model_dump()
    await db.menu_items.insert_one(doc)
    return item


@api_router.put("/admin/menu/{item_id}", response_model=MenuItem)
async def admin_update_menu(item_id: str, payload: MenuItemUpdate, admin=Depends(get_current_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        existing = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return existing
    result = await db.menu_items.find_one_and_update(
        {"id": item_id},
        {"$set": updates},
        projection={"_id": 0},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return result


@api_router.delete("/admin/menu/{item_id}")
async def admin_delete_menu(item_id: str, admin=Depends(get_current_admin)):
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True}


# ---------- Orders ----------
async def _next_order_number() -> str:
    # Count orders today + 1001 for a readable number
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    count = await db.orders.count_documents({"order_number": {"$regex": f"^{today}"}})
    return f"{today}-{1001 + count}"


@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    if not payload.items:
        raise HTTPException(status_code=400, detail="El carrito está vacío")

    # Recompute total from server-side known prices
    ids = [it.menu_item_id for it in payload.items]
    menu_docs = await db.menu_items.find({"id": {"$in": ids}}, {"_id": 0}).to_list(1000)
    price_map = {d["id"]: d for d in menu_docs}

    verified_items: List[OrderItem] = []
    total = 0.0
    for it in payload.items:
        md = price_map.get(it.menu_item_id)
        if not md or not md.get("is_available", True):
            raise HTTPException(status_code=400, detail=f"Producto no disponible: {it.name}")
        qty = max(1, int(it.quantity))
        line = OrderItem(
            menu_item_id=md["id"], name=md["name"], price=float(md["price"]), quantity=qty
        )
        verified_items.append(line)
        total += line.price * qty

    order = Order(
        order_number=await _next_order_number(),
        customer_name=payload.customer_name.strip(),
        customer_phone=payload.customer_phone.strip(),
        pickup_time=payload.pickup_time.strip(),
        notes=payload.notes.strip(),
        items=verified_items,
        total=round(total, 2),
    )
    doc = order.model_dump()
    await db.orders.insert_one(doc)
    return order


@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return doc


@api_router.get("/admin/orders", response_model=List[Order])
async def admin_list_orders(admin=Depends(get_current_admin)):
    items = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api_router.patch("/admin/orders/{order_id}/status", response_model=Order)
async def admin_update_order_status(
    order_id: str, payload: OrderStatusUpdate, admin=Depends(get_current_admin)
):
    result = await db.orders.find_one_and_update(
        {"id": order_id},
        {"$set": {"status": payload.status}},
        projection={"_id": 0},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return result


@api_router.get("/")
async def root():
    return {"message": "ATOM TakeAway API"}


# ---------- Seeding ----------
SEED_MENU = [
    # Burgers
    {"name": "Atom Classic", "description": "Carne angus 150g, queso cheddar, lechuga, tomate y salsa de la casa.", "price": 8.50, "category": "burgers", "image_url": "https://images.pexels.com/photos/29368033/pexels-photo-29368033.jpeg"},
    {"name": "Smash Doble", "description": "Doble carne smasheada, queso americano fundido y cebolla caramelizada.", "price": 10.90, "category": "burgers", "image_url": "https://images.unsplash.com/photo-1700513970028-d8a630d21c6e?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Crispy Chicken", "description": "Pollo crocante, pepinillos y mayonesa picante en pan brioche.", "price": 9.20, "category": "burgers", "image_url": "https://images.pexels.com/photos/4315148/pexels-photo-4315148.jpeg"},
    {"name": "Veggie Atom", "description": "Hamburguesa de garbanzo y remolacha, aguacate y rúcula.", "price": 8.90, "category": "burgers", "image_url": "https://images.unsplash.com/photo-1630852026727-cedb31e3f956?crop=entropy&cs=srgb&fm=jpg&q=85"},
    # Fries
    {"name": "Papas Clásicas", "description": "Papas fritas doradas con sal marina.", "price": 3.50, "category": "fries", "image_url": "https://images.pexels.com/photos/31771051/pexels-photo-31771051.jpeg"},
    {"name": "Papas Crinkle", "description": "Papas onduladas extra crocantes.", "price": 4.20, "category": "fries", "image_url": "https://images.pexels.com/photos/32421783/pexels-photo-32421783.jpeg"},
    {"name": "Aros de Cebolla", "description": "Aros crujientes con salsa ranch.", "price": 4.50, "category": "fries", "image_url": "https://images.pexels.com/photos/4315148/pexels-photo-4315148.jpeg"},
    # Coffee
    {"name": "Espresso", "description": "Shot intenso de café de especialidad.", "price": 2.20, "category": "coffee", "image_url": "https://images.pexels.com/photos/31011917/pexels-photo-31011917.jpeg"},
    {"name": "Cappuccino", "description": "Espresso con leche vaporizada y espuma sedosa.", "price": 3.40, "category": "coffee", "image_url": "https://images.unsplash.com/photo-1670932599207-764a68cf1574?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Latte Vainilla", "description": "Latte cremoso con jarabe artesanal de vainilla.", "price": 3.80, "category": "coffee", "image_url": "https://images.pexels.com/photos/31011917/pexels-photo-31011917.jpeg"},
    # Bakery
    {"name": "Croissant de Mantequilla", "description": "Hojaldre artesanal, dorado y crujiente.", "price": 2.90, "category": "bakery", "image_url": "https://images.unsplash.com/photo-1771415675633-1f17a16c7f6a?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Cheesecake Clásico", "description": "Tarta de queso cremosa con base de galleta.", "price": 4.50, "category": "bakery", "image_url": "https://images.unsplash.com/photo-1771415675633-1f17a16c7f6a?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Muffin de Arándanos", "description": "Muffin esponjoso cargado de arándanos frescos.", "price": 3.20, "category": "bakery", "image_url": "https://images.unsplash.com/photo-1542200684142-9e7bf8ce104b?crop=entropy&cs=srgb&fm=jpg&q=85"},
]


async def seed_admin():
    email = os.environ["ADMIN_EMAIL"].lower()
    password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin user: %s", email)
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one(
            {"email": email}, {"$set": {"password_hash": hash_password(password)}}
        )
        logger.info("Updated admin password for: %s", email)


async def seed_menu():
    count = await db.menu_items.count_documents({})
    if count > 0:
        return
    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for item in SEED_MENU:
        docs.append({
            "id": str(uuid.uuid4()),
            "name": item["name"],
            "description": item["description"],
            "price": item["price"],
            "category": item["category"],
            "image_url": item["image_url"],
            "is_available": True,
            "created_at": now,
        })
    await db.menu_items.insert_many(docs)
    logger.info("Seeded %d menu items", len(docs))


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.menu_items.create_index("category")
    await db.orders.create_index("order_number")
    await seed_admin()
    await seed_menu()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
