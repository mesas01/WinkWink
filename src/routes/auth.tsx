import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso seguro — WinkWink" },
      { name: "description", content: "Accede a tus facturas privadas en WinkWink." },
      { property: "og:title", content: "Acceso seguro — WinkWink" },
      { property: "og:description", content: "Inicio de sesión en WinkWink." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Navigate to="/login" replace />,
});
