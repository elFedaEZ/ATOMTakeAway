"""Backend API tests for ATOM TakeAway."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://grab-and-go-6.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@atomtakeaway.com"
ADMIN_PASSWORD = "atom2026"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    assert data["user"]["email"] == ADMIN_EMAIL
    assert data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d.get("token"), str) and len(d["token"]) > 10
        assert d["user"]["role"] == "admin"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_with_token(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Public menu ----------
class TestMenu:
    def test_list_menu(self):
        r = requests.get(f"{API}/menu")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 13, f"expected >=13 seeded items, got {len(items)}"
        sample = items[0]
        for k in ("id", "name", "price", "category", "is_available"):
            assert k in sample
        assert all(i["is_available"] for i in items)


# ---------- Admin menu CRUD ----------
class TestAdminMenu:
    def test_admin_menu_requires_auth(self):
        r = requests.get(f"{API}/admin/menu")
        assert r.status_code == 401

    def test_admin_menu_list(self, admin_headers):
        r = requests.get(f"{API}/admin/menu", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_menu_crud(self, admin_headers):
        payload = {
            "name": "TEST_Item",
            "description": "tmp",
            "price": 1.99,
            "category": "coffee",
            "image_url": "",
            "is_available": True,
        }
        r = requests.post(f"{API}/admin/menu", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        item = r.json()
        item_id = item["id"]
        assert item["name"] == "TEST_Item"

        # Update
        r2 = requests.put(f"{API}/admin/menu/{item_id}", json={"price": 2.50, "is_available": False}, headers=admin_headers)
        assert r2.status_code == 200
        assert r2.json()["price"] == 2.50
        assert r2.json()["is_available"] is False

        # Verify unavailable item not in public list
        pub = requests.get(f"{API}/menu").json()
        assert not any(i["id"] == item_id for i in pub)

        # Delete
        r3 = requests.delete(f"{API}/admin/menu/{item_id}", headers=admin_headers)
        assert r3.status_code == 200

        # 404 after delete
        r4 = requests.delete(f"{API}/admin/menu/{item_id}", headers=admin_headers)
        assert r4.status_code == 404


# ---------- Orders ----------
class TestOrders:
    def test_create_order_empty(self):
        r = requests.post(f"{API}/orders", json={
            "customer_name": "TEST_User",
            "customer_phone": "123",
            "items": []
        })
        assert r.status_code == 400

    def test_create_and_get_order(self, admin_headers):
        menu = requests.get(f"{API}/menu").json()
        assert menu, "no menu items to order"
        m = menu[0]
        order_payload = {
            "customer_name": "TEST_Customer",
            "customer_phone": "555-0100",
            "pickup_time": "12:30",
            "notes": "sin cebolla",
            "items": [
                {"menu_item_id": m["id"], "name": m["name"], "price": m["price"], "quantity": 2}
            ],
        }
        r = requests.post(f"{API}/orders", json=order_payload)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["order_number"]
        assert order["status"] == "pending"
        assert order["total"] == round(m["price"] * 2, 2)

        # GET by id
        oid = order["id"]
        rg = requests.get(f"{API}/orders/{oid}")
        assert rg.status_code == 200
        assert rg.json()["id"] == oid

        # Admin list
        ral = requests.get(f"{API}/admin/orders", headers=admin_headers)
        assert ral.status_code == 200
        assert any(o["id"] == oid for o in ral.json())

        # Status transitions
        for st in ("preparing", "ready", "completed"):
            rs = requests.patch(f"{API}/admin/orders/{oid}/status", json={"status": st}, headers=admin_headers)
            assert rs.status_code == 200, rs.text
            assert rs.json()["status"] == st

    def test_admin_orders_unauth(self):
        r = requests.get(f"{API}/admin/orders")
        assert r.status_code == 401
