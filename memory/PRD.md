# ATOM TakeAway — PRD

## Problem statement
Build a shop app for a take-away food place. User chose: Burgers & fries + Coffee & bakery, Menu + cart + checkout + admin panel, Cash on pickup, Modern & minimal design, Green + Cyan palette, Spanish language. Name: ATOM TakeAway.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor) with JWT admin auth (bcrypt)
- **Frontend**: React 19 + react-router-dom + shadcn UI + Tailwind + sonner
- **Design**: Modern minimal, light theme, Outfit (headings) + Manrope (body), green/cyan accents

## User personas
- **Customer**: browses menu, fills cart, checks out with phone + pickup time, receives order number
- **Admin**: single seeded admin manages menu items (CRUD) + updates order status through pipeline

## What's implemented (2026-02-23)
- Public menu API (`GET /api/menu`), places order (`POST /api/orders`), view order (`GET /api/orders/{id}`)
- Admin JWT auth (`POST /api/auth/login`, `GET /api/auth/me`)
- Admin menu CRUD (`/api/admin/menu`)
- Admin orders list + status update (`/api/admin/orders`, `PATCH /api/admin/orders/{id}/status`)
- Auto-seeding of admin account and 13 sample menu items
- Home page (hero, categories, filterable menu grid, how-it-works, footer)
- Shopping cart drawer (add / update qty / remove / checkout)
- Order confirmation page
- Admin login + dashboard with Orders & Menu tabs

## Prioritized backlog
- P1: Order realtime refresh in admin (polling or websocket)
- P1: Customer phone-based order lookup
- P2: Daily sales dashboard
- P2: Multiple admins / roles
- P2: Image upload for menu items (currently URL-based)
- P2: Email / SMS notification on status changes
