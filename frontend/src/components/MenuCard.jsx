import React from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";

export default function MenuCard({ item }) {
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem(item, 1);
    toast.success("Añadido al carrito", {
      description: item.name,
    });
  };

  return (
    <div
      className="atom-card group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white"
      data-testid={`menu-item-${item.id}`}
    >
      <div className="aspect-square w-full overflow-hidden bg-zinc-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            Sin imagen
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold leading-tight text-zinc-900">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-500">
            {item.description}
          </p>
        )}
        <div className="mt-5 flex items-center justify-between">
          <span
            className="font-display text-xl font-bold tracking-tight text-zinc-900"
            data-testid={`menu-item-price-${item.id}`}
          >
            ${item.price.toFixed(2)}
          </span>
          <Button
            size="sm"
            onClick={handleAdd}
            className="atom-btn-press rounded-full bg-zinc-900 px-4 text-white hover:bg-cyan-600"
            data-testid={`add-to-cart-btn-${item.id}`}
          >
            <Plus className="mr-1 h-4 w-4" strokeWidth={2.5} />
            Añadir
          </Button>
        </div>
      </div>
    </div>
  );
}
