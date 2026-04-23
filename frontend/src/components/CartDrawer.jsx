import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, X, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import api from "../lib/api";

export default function CartDrawer({ open, onOpenChange }) {
  const { items, updateQty, removeItem, totalPrice, totalCount, clear } = useCart();
  const [view, setView] = useState("cart"); // "cart" | "checkout"
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    pickup_time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      toast.error("Por favor completa nombre y teléfono.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({
          menu_item_id: i.menu_item_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      };
      const { data } = await api.post("/orders", payload);
      clear();
      setView("cart");
      setForm({ customer_name: "", customer_phone: "", pickup_time: "", notes: "" });
      onOpenChange(false);
      navigate(`/order/${data.id}`);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "No se pudo crear el pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex w-full flex-col gap-0 bg-white sm:max-w-md"
        data-testid="cart-drawer"
      >
        <SheetHeader className="border-b border-zinc-200 pb-4">
          <SheetTitle className="font-display text-2xl font-bold">
            {view === "cart" ? "Tu carrito" : "Finalizar compra"}
          </SheetTitle>
          <SheetDescription className="text-sm text-zinc-500">
            {view === "cart"
              ? totalCount > 0
                ? `${totalCount} ${totalCount === 1 ? "producto" : "productos"}`
                : "Tu carrito está vacío."
              : "Pago en efectivo al retirar."}
          </SheetDescription>
        </SheetHeader>

        {view === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
                    <ShoppingBag className="h-7 w-7 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-500">
                    Añade algunos productos para empezar.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((it) => (
                    <li
                      key={it.menu_item_id}
                      className="flex gap-3 rounded-xl border border-zinc-200 p-3"
                      data-testid={`cart-line-${it.menu_item_id}`}
                    >
                      <img
                        src={it.image_url}
                        alt={it.name}
                        className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                      />
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-sm font-semibold text-zinc-900">
                              {it.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              ${it.price.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(it.menu_item_id)}
                            className="text-zinc-400 transition-colors hover:text-red-500"
                            data-testid={`remove-line-${it.menu_item_id}`}
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full border border-zinc-200">
                            <button
                              onClick={() => updateQty(it.menu_item_id, it.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100"
                              data-testid={`decrease-qty-${it.menu_item_id}`}
                              aria-label="Quitar uno"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">
                              {it.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(it.menu_item_id, it.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100"
                              data-testid={`increase-qty-${it.menu_item_id}`}
                              aria-label="Añadir uno"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-zinc-900">
                            ${(it.price * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-zinc-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Subtotal</span>
                  <span
                    className="font-display text-2xl font-bold"
                    data-testid="cart-total"
                  >
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={() => setView("checkout")}
                  className="atom-btn-press mt-4 h-12 w-full rounded-full bg-zinc-900 text-base text-white hover:bg-cyan-600"
                  data-testid="go-to-checkout-btn"
                >
                  Continuar al pago
                </Button>
              </div>
            )}
          </>
        )}

        {view === "checkout" && (
          <form onSubmit={handleCheckout} className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex-1 space-y-4 py-4">
              <div>
                <Label htmlFor="customer_name">Nombre completo</Label>
                <Input
                  id="customer_name"
                  placeholder="Ana García"
                  value={form.customer_name}
                  onChange={handleChange("customer_name")}
                  required
                  data-testid="checkout-name"
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Teléfono</Label>
                <Input
                  id="customer_phone"
                  placeholder="+34 600 000 000"
                  value={form.customer_phone}
                  onChange={handleChange("customer_phone")}
                  required
                  data-testid="checkout-phone"
                />
              </div>
              <div>
                <Label htmlFor="pickup_time">Hora de retiro (opcional)</Label>
                <Input
                  id="pickup_time"
                  placeholder="Ej. 13:30"
                  value={form.pickup_time}
                  onChange={handleChange("pickup_time")}
                  data-testid="checkout-pickup-time"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Sin cebolla, extra salsa..."
                  value={form.notes}
                  onChange={handleChange("notes")}
                  data-testid="checkout-notes"
                />
              </div>

              <Separator />

              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Total a pagar</span>
                  <span className="font-display text-2xl font-bold">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Pago en efectivo al retirar.
                </p>
              </div>
            </div>

            <div className="flex gap-2 border-t border-zinc-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setView("cart")}
                className="atom-btn-press rounded-full"
                data-testid="back-to-cart-btn"
              >
                Volver
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="atom-btn-press h-12 flex-1 rounded-full bg-emerald-500 text-base text-white hover:bg-emerald-600"
                data-testid="checkout-submit-btn"
              >
                {submitting ? "Enviando..." : "Confirmar pedido"}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
