import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { LogOut, Plus, Pencil, Trash2, RefreshCw, Atom } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { toast } from "sonner";

const CATEGORY_LABELS = {
  burgers: "Hamburguesas",
  fries: "Papas",
  coffee: "Café",
  bakery: "Panadería",
};

const STATUS_FLOW = ["pending", "preparing", "ready", "completed"];
const STATUS_LABELS = {
  pending: { label: "Pendiente", color: "bg-zinc-200 text-zinc-700" },
  preparing: { label: "Preparando", color: "bg-amber-100 text-amber-800" },
  ready: { label: "Listo", color: "bg-emerald-100 text-emerald-800" },
  completed: { label: "Entregado", color: "bg-cyan-100 text-cyan-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

const EMPTY_ITEM = {
  name: "",
  description: "",
  price: "",
  category: "burgers",
  image_url: "",
  is_available: true,
};

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);

  const loadAll = async () => {
    try {
      const [m, o] = await Promise.all([
        api.get("/admin/menu"),
        api.get("/admin/orders"),
      ]);
      setMenu(m.data);
      setOrders(o.data);
    } catch {
      toast.error("No se pudieron cargar los datos.");
    }
  };

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  if (loading) return <div className="p-10 text-center text-zinc-500">Cargando...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_ITEM);
    setEditOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category: item.category,
      image_url: item.image_url || "",
      is_available: item.is_available,
    });
    setEditOpen(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      category: form.category,
      image_url: form.image_url.trim(),
      is_available: !!form.is_available,
    };
    if (!payload.name || Number.isNaN(payload.price)) {
      toast.error("Nombre y precio son obligatorios.");
      return;
    }
    try {
      if (editing) {
        await api.put(`/admin/menu/${editing.id}`, payload);
        toast.success("Producto actualizado.");
      } else {
        await api.post("/admin/menu", payload);
        toast.success("Producto creado.");
      }
      setEditOpen(false);
      loadAll();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Error al guardar.");
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    try {
      await api.delete(`/admin/menu/${id}`);
      toast.success("Producto eliminado.");
      loadAll();
    } catch {
      toast.error("Error al eliminar.");
    }
  };

  const updateStatus = async (order, newStatus) => {
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status: newStatus });
      loadAll();
    } catch {
      toast.error("Error al actualizar estado.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--atom-bg)]">
      <header className="atom-nav sticky top-0 z-30 border-b border-zinc-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-2" data-testid="admin-logo-link">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white">
              <Atom className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="font-display text-lg font-bold text-zinc-900">ATOM</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-600">
                Admin
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAll}
              className="rounded-full"
              data-testid="admin-refresh-btn"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="rounded-full text-zinc-700 hover:bg-red-50 hover:text-red-600"
              data-testid="admin-logout-btn"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div>
          <span className="atom-overline">Panel de administración</span>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Hola, {user.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gestiona el menú y los pedidos en tiempo real.
          </p>
        </div>

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList className="rounded-full bg-zinc-100 p-1">
            <TabsTrigger
              value="orders"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow"
              data-testid="tab-orders"
            >
              Pedidos
              <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs">
                {orders.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="menu"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow"
              data-testid="tab-menu"
            >
              Menú
              <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs">
                {menu.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-zinc-500">
                        Aún no hay pedidos.
                      </TableCell>
                    </TableRow>
                  )}
                  {orders.map((o) => {
                    const s = STATUS_LABELS[o.status] || STATUS_LABELS.pending;
                    const curIdx = STATUS_FLOW.indexOf(o.status);
                    const nextStatus = curIdx >= 0 && curIdx < STATUS_FLOW.length - 1
                      ? STATUS_FLOW[curIdx + 1]
                      : null;
                    return (
                      <TableRow key={o.id} data-testid={`order-row-${o.id}`}>
                        <TableCell className="font-mono text-xs">
                          #{o.order_number}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-zinc-900">
                            {o.customer_name}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {o.customer_phone}
                            {o.pickup_time && ` · ${o.pickup_time}`}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs text-xs text-zinc-600">
                          {o.items
                            .map((i) => `${i.quantity}× ${i.name}`)
                            .join(", ")}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${o.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${s.color}`}
                          >
                            {s.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {nextStatus && (
                              <Button
                                size="sm"
                                onClick={() => updateStatus(o, nextStatus)}
                                className="rounded-full bg-zinc-900 text-white hover:bg-cyan-600"
                                data-testid={`advance-status-${o.id}`}
                              >
                                → {STATUS_LABELS[nextStatus].label}
                              </Button>
                            )}
                            {o.status !== "cancelled" && o.status !== "completed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateStatus(o, "cancelled")}
                                className="rounded-full text-red-600 hover:bg-red-50"
                                data-testid={`cancel-order-${o.id}`}
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="menu" className="mt-6">
            <div className="mb-4 flex justify-end">
              <Button
                onClick={openCreate}
                className="atom-btn-press rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                data-testid="create-menu-item-btn"
              >
                <Plus className="mr-1 h-4 w-4" />
                Nuevo producto
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Disponible</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menu.map((m) => (
                    <TableRow key={m.id} data-testid={`menu-row-${m.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {m.image_url && (
                            <img
                              src={m.image_url}
                              alt={m.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-zinc-900">{m.name}</p>
                            <p className="line-clamp-1 text-xs text-zinc-500">
                              {m.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-600">
                        {CATEGORY_LABELS[m.category]}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${m.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            m.is_available
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-200 text-zinc-600"
                          }`}
                        >
                          {m.is_available ? "Sí" : "No"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(m)}
                            data-testid={`edit-menu-${m.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteItem(m.id)}
                            className="text-red-600 hover:bg-red-50"
                            data-testid={`delete-menu-${m.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent data-testid="menu-edit-dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveItem} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                data-testid="menu-form-name"
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                data-testid="menu-form-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  data-testid="menu-form-price"
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger data-testid="menu-form-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="image_url">URL de imagen</Label>
              <Input
                id="image_url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
                data-testid="menu-form-image"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Disponible en el menú</p>
                <p className="text-xs text-zinc-500">
                  Los clientes solo verán productos disponibles.
                </p>
              </div>
              <Switch
                checked={form.is_available}
                onCheckedChange={(v) => setForm({ ...form, is_available: v })}
                data-testid="menu-form-available"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-zinc-900 text-white hover:bg-cyan-600"
                data-testid="menu-form-save"
              >
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
