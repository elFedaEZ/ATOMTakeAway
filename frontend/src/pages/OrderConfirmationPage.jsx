import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, Home, Phone, StickyNote } from "lucide-react";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

const STATUS_LABELS = {
  pending: { label: "Pendiente", color: "bg-zinc-200 text-zinc-700" },
  preparing: { label: "Preparando", color: "bg-amber-100 text-amber-800" },
  ready: { label: "Listo para retirar", color: "bg-emerald-100 text-emerald-800" },
  completed: { label: "Entregado", color: "bg-cyan-100 text-cyan-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-48 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">Pedido no encontrado</h1>
        <Button asChild className="mt-6 rounded-full bg-zinc-900 hover:bg-cyan-600">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending;

  return (
    <div className="min-h-screen bg-[var(--atom-bg)]">
      <div className="mx-auto max-w-2xl px-6 py-16 lg:py-20">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <span className="atom-overline mt-6">Pedido confirmado</span>
          <h1
            className="mt-3 font-display text-4xl font-bold tracking-tighter text-zinc-900 sm:text-5xl"
            data-testid="order-confirmation-heading"
          >
            ¡Gracias, {order.customer_name.split(" ")[0]}!
          </h1>
          <p className="mt-3 max-w-md text-zinc-500">
            Tu pedido está en cola. Te esperamos en la tienda para retirarlo.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Nº de pedido
              </p>
              <p
                className="font-display text-2xl font-bold"
                data-testid="order-number"
              >
                #{order.order_number}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}
              data-testid="order-status-pill"
            >
              {status.label}
            </span>
          </div>

          <ul className="divide-y divide-zinc-100 py-2">
            {order.items.map((it, idx) => (
              <li
                key={`${it.menu_item_id}-${idx}`}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-900">{it.name}</p>
                  <p className="text-xs text-zinc-500">
                    x{it.quantity} · ${it.price.toFixed(2)}
                  </p>
                </div>
                <span className="font-semibold text-zinc-900">
                  ${(it.price * it.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
            <span className="text-sm text-zinc-500">Total (pago en efectivo)</span>
            <span className="font-display text-2xl font-bold">
              ${order.total.toFixed(2)}
            </span>
          </div>

          <div className="mt-6 grid gap-3 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-cyan-600" />
              <span>{order.customer_phone}</span>
            </div>
            {order.pickup_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span>Retiro: {order.pickup_time}</span>
              </div>
            )}
            {order.notes && (
              <div className="flex items-start gap-2">
                <StickyNote className="mt-0.5 h-4 w-4 text-zinc-500" />
                <span>{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            asChild
            className="atom-btn-press rounded-full bg-zinc-900 px-6 text-white hover:bg-cyan-600"
          >
            <Link to="/" data-testid="back-home-btn">
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
