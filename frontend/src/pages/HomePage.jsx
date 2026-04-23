import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock, MapPin, Phone } from "lucide-react";
import Header from "../components/Header";
import CartDrawer from "../components/CartDrawer";
import MenuCard from "../components/MenuCard";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import api from "../lib/api";

const CATEGORIES = [
  {
    key: "burgers",
    label: "Hamburguesas",
    tagline: "Carne angus, smash y opciones vegetales.",
    image:
      "https://images.pexels.com/photos/4315148/pexels-photo-4315148.jpeg",
  },
  {
    key: "fries",
    label: "Papas & Sides",
    tagline: "Crujientes recién hechas.",
    image:
      "https://images.pexels.com/photos/32421783/pexels-photo-32421783.jpeg",
  },
  {
    key: "coffee",
    label: "Café",
    tagline: "Grano de especialidad, tostado local.",
    image:
      "https://images.unsplash.com/photo-1670932599207-764a68cf1574?crop=entropy&cs=srgb&fm=jpg&q=85",
  },
  {
    key: "bakery",
    label: "Panadería",
    tagline: "Horneado cada mañana.",
    image:
      "https://images.unsplash.com/photo-1771415675633-1f17a16c7f6a?crop=entropy&cs=srgb&fm=jpg&q=85",
  },
];

export default function HomePage() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/menu");
        setMenu(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => (activeCategory === "all" ? menu : menu.filter((m) => m.category === activeCategory)),
    [menu, activeCategory]
  );

  return (
    <div className="min-h-screen bg-[var(--atom-bg)]">
      <Header onOpenCart={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

      {/* Hero */}
      <section className="atom-hero-accent relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-16 md:py-24 lg:px-10 lg:py-28">
          <div>
            <span className="atom-overline" data-testid="hero-overline">
              Take-Away · Fresco · Rápido
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tighter text-zinc-900 sm:text-5xl lg:text-6xl">
              Sabores que viajan{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                contigo.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              Hamburguesas artesanales, papas doradas, café de especialidad y panadería
              recién horneada. Pídelo en línea y retíralo listo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                className="atom-btn-press h-12 rounded-full bg-zinc-900 px-6 text-base text-white hover:bg-cyan-600"
              >
                <a href="#menu" data-testid="hero-cta-menu">
                  Ver menú
                  <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="atom-btn-press h-12 rounded-full border-zinc-300 bg-white px-6 text-base hover:border-cyan-500 hover:bg-cyan-50"
              >
                <a href="#como-funciona" data-testid="hero-cta-how">
                  Cómo funciona
                </a>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-600" />
                <span>Listo en 15 min</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span>Retiro en tienda</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-cyan-600" />
                <span>Pago en efectivo</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1630852026727-cedb31e3f956?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="Hamburguesa gourmet"
                className="h-[440px] w-full object-cover sm:h-[520px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <span className="atom-overline">Categorías</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Elige lo que te apetece hoy.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setActiveCategory(c.key);
                  document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="atom-card group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left"
                data-testid={`category-card-${c.key}`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-zinc-100">
                  <img
                    src={c.image}
                    alt={c.label}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold text-zinc-900">
                    {c.label}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">{c.tagline}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="atom-overline">Menú</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Nuestro menú completo
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-cyan-500 hover:text-cyan-700"
              }`}
              data-testid="filter-all"
            >
              Todos
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === c.key
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-cyan-500 hover:text-cyan-700"
                }`}
                data-testid={`filter-${c.key}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-0">
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="space-y-2 p-5">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                </div>
              ))
            : filtered.map((item) => <MenuCard key={item.id} item={item} />)}
        </div>
        {!loading && filtered.length === 0 && (
          <p className="mt-12 text-center text-sm text-zinc-500">
            No hay productos en esta categoría.
          </p>
        )}
      </section>

      {/* How it works */}
      <section
        id="como-funciona"
        className="border-t border-zinc-200 bg-zinc-50"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <span className="atom-overline">Cómo funciona</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Tres pasos. Cero complicaciones.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Elige tu menú",
                d: "Explora nuestras hamburguesas, papas, cafés y panadería.",
              },
              {
                n: "02",
                t: "Confirma tu pedido",
                d: "Déjanos tu nombre, teléfono y hora de retiro estimada.",
              },
              {
                n: "03",
                t: "Retira y disfruta",
                d: "Paga en efectivo al retirar. Fresco y listo para ti.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="rounded-2xl border border-zinc-200 bg-white p-8"
              >
                <div className="font-display text-sm font-bold tracking-[0.2em] text-cyan-600">
                  {step.n}
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-zinc-900">
                  {step.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="border-t border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-3 lg:px-10">
          <div>
            <div className="font-display text-xl font-bold tracking-tight text-zinc-900">
              ATOM TakeAway
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Comida fresca para llevar. Hecha con mimo cada día.
            </p>
          </div>
          <div>
            <p className="atom-overline">Horario</p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-600">
              <li>Lun - Vie · 08:00 – 22:00</li>
              <li>Sáb - Dom · 09:00 – 23:00</li>
            </ul>
          </div>
          <div>
            <p className="atom-overline">Contacto</p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-600">
              <li>+34 600 000 000</li>
              <li>hola@atomtakeaway.com</li>
              <li>Calle Mayor 12, Madrid</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-200 py-4">
          <p className="text-center text-xs text-zinc-400">
            © {new Date().getFullYear()} ATOM TakeAway. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
