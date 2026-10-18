import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { socialLoginAvailable } from "@/lib/social-login";
import "@lovable.dev/cloud-auth-js/styles.css";
import { useApp } from "@/lib/store";
import { Logo, LangSwitch, ThemeToggle } from "@/components/blinka";
import { LegalLinks } from "@/components/legal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Iniciar sesión — WinkWink" },
      {
        name: "description",
        content: "Acceso seguro al historial privado de facturas de WinkWink.",
      },
      { property: "og:title", content: "Iniciar sesión — WinkWink" },
      { property: "og:description", content: "Cuentas privadas para empleados y administración." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});
function Login() {
  const es = useApp((s) => s.lang) === "es";
  const nav = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) nav({ to: "/dashboard" });
    });
  }, [nav]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const email = z.string().trim().email().max(255).parse(f.get("email"));
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage(
          es
            ? "Si existe una cuenta, recibirás un enlace para restablecer la contraseña."
            : "If an account exists, you will receive a reset link.",
        );
        return;
      }
      const password = z
        .string()
        .min(mode === "signup" ? 8 : 1)
        .max(128)
        .parse(f.get("password"));
      if (mode === "signup") {
        const name = z.string().trim().min(1).max(100).parse(f.get("name"));
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
        });
        if (error) throw error;
        setMessage(
          es
            ? "Revisa tu correo para confirmar tu cuenta antes de entrar."
            : "Check your email to confirm your account before signing in.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        qc.clear();
        await nav({ to: "/dashboard" });
      }
    } catch (error) {
      setMessage(
        error instanceof z.ZodError
          ? es
            ? "Revisa los campos del formulario."
            : "Check the form fields."
          : error instanceof Error
            ? error.message
            : "Error",
      );
    } finally {
      setBusy(false);
    }
  }
  async function social(provider: "google" | "lovable") {
    setBusy(true);
    setMessage("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!result.redirected) {
        qc.clear();
        await nav({ to: "/dashboard" });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-dvh bg-surface">
      <header className="glass-bar sticky top-0 z-40">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <LangSwitch />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto my-10 max-w-md surface-card bg-card px-6 py-8 shadow-lift sm:my-16 sm:px-8"
      >
        <h1 className="text-3xl font-extrabold tracking-[-0.025em]">
          {mode === "signup"
            ? es
              ? "Crear cuenta"
              : "Create account"
            : mode === "forgot"
              ? es
                ? "Recuperar acceso"
                : "Recover access"
              : es
                ? "Bienvenido de nuevo"
                : "Welcome back"}
        </h1>
        <form onSubmit={submit} className="mt-8 space-y-5">
          {mode === "signup" && (
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                {es ? "Nombre" : "Name"}
              </label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                className="mt-2"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              {es ? "Correo electrónico" : "Email"}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={255}
              className="mt-2"
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                {es ? "Contraseña" : "Password"}
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={mode === "signup" ? 8 : 1}
                maxLength={128}
                className="mt-2"
              />
            </div>
          )}
          {mode === "signup" && (
            <p className="text-sm text-muted-foreground">
              {es
                ? "Al crear una cuenta se almacena tu correo y nombre para el acceso. La autorización para usar documentos se solicita después de entrar."
                : "Account creation stores your email and name for access. Document-processing authorization is requested after sign-in."}{" "}
              <Link to="/privacy" className="font-semibold text-brand underline">
                {es ? "Privacidad" : "Privacy"}
              </Link>
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full min-h-11">
            {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            {mode === "signup"
              ? es
                ? "Crear cuenta"
                : "Create account"
              : mode === "forgot"
                ? es
                  ? "Enviar enlace"
                  : "Send link"
                : es
                  ? "Entrar"
                  : "Sign in"}
          </Button>
        </form>
        <p role="status" aria-live="polite" className="mt-4 break-words text-sm">
          {message}
        </p>
        {mode !== "forgot" && !socialLoginAvailable() && (
          <div className="mt-5 rounded-2xl bg-secondary/60 p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground">
              {es
                ? "El acceso con Google está disponible solo en la versión alojada en Lovable. Aquí puedes entrar con tu correo, o probar el agente sin cuenta."
                : "Google sign-in is only available on the Lovable-hosted version. Here you can sign in with email, or try the agent without an account."}
            </p>
            <Link to="/agente" className="mt-2 inline-flex font-medium text-brand hover:underline">
              {es ? "Probar el agente sin cuenta →" : "Try the agent without an account →"}
            </Link>
          </div>
        )}
        {mode !== "forgot" && socialLoginAvailable() && (
          <div className="mt-5 space-y-3">
            <Button
              variant="outline"
              disabled={busy}
              className="w-full"
              onClick={() => social("google")}
            >
              {es ? "Continuar con Google" : "Continue with Google"}
            </Button>
            <Button
              disabled={busy}
              className="lovable-auth-button w-full"
              onClick={() => social("lovable")}
            >
              {es ? "Continuar con Lovable" : "Continue with Lovable"}
            </Button>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="link"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setMessage("");
            }}
          >
            {mode === "signup"
              ? es
                ? "Ya tengo cuenta"
                : "I have an account"
              : es
                ? "Crear cuenta"
                : "Create account"}
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setMode(mode === "forgot" ? "login" : "forgot");
              setMessage("");
            }}
          >
            {es ? "¿Olvidaste tu contraseña?" : "Forgot password?"}
          </Button>
        </div>
        <footer className="mt-10 border-t pt-5">
          <LegalLinks />
        </footer>
      </motion.section>
    </div>
  );
}
