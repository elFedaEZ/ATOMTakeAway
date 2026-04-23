import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, Atom } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Bienvenido, admin");
      navigate("/admin", { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="atom-hero-accent min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg">
            <Atom className="h-6 w-6" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="mt-6 text-center font-display text-3xl font-bold tracking-tight text-zinc-900">
          Panel de Administración
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Inicia sesión para gestionar productos y pedidos.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
        >
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@atomtakeaway.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="admin-login-email"
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="admin-login-password"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="atom-btn-press mt-2 h-12 w-full rounded-full bg-zinc-900 text-white hover:bg-cyan-600"
            data-testid="admin-login-submit"
          >
            <Lock className="mr-2 h-4 w-4" />
            {submitting ? "Entrando..." : "Iniciar sesión"}
          </Button>
        </form>
      </div>
    </div>
  );
}
