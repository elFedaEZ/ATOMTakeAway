import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Atom } from "lucide-react";
import { useCart } from "../context/CartContext";
import { Button } from "./ui/button";

export default function Header({ onOpenCart }) {
  const { totalCount, bump } = useCart();
  const [bumping, setBumping] = useState(false);

  useEffect(() => {
    if (bump === 0) return;
    setBumping(true);
    const t = setTimeout(() => setBumping(false), 450);
    return () => clearTimeout(t);
  }, [bump]);

  return (
    <header
      className="atom-nav sticky top-0 z-40 w-full border-b border-zinc-200"
      data-testid="site-header"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link
          to="/"
          className="flex items-center gap-2 group"
          data-testid="logo-link"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-sm">
            <Atom className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <div className="font-display text-lg font-bold tracking-tight text-zinc-900">
              ATOM
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-600">
              TakeAway
            </div>
          </div>
        </Link>

        <nav className="hidden gap-8 md:flex">
          <a
            href="#menu"
            className="text-sm font-medium text-zinc-700 transition-colors hover:text-cyan-600"
            data-testid="nav-menu"
          >
            Menú
          </a>
          <a
            href="#como-funciona"
            className="text-sm font-medium text-zinc-700 transition-colors hover:text-cyan-600"
            data-testid="nav-how"
          >
            Cómo funciona
          </a>
          <a
            href="#contacto"
            className="text-sm font-medium text-zinc-700 transition-colors hover:text-cyan-600"
            data-testid="nav-contact"
          >
            Contacto
          </a>
        </nav>

        <Button
          variant="outline"
          onClick={onOpenCart}
          className={`atom-btn-press relative border-zinc-300 bg-white hover:border-cyan-500 hover:bg-cyan-50 ${
            bumping ? "atom-cart-bump" : ""
          }`}
          data-testid="open-cart-btn"
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Carrito</span>
          {totalCount > 0 && (
            <span
              className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white"
              data-testid="cart-count-badge"
            >
              {totalCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
