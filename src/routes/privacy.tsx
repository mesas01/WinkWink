import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal";
export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacidad — WinkWink" },
      {
        name: "description",
        content: "Tratamiento de datos, autorización y derechos de titulares en WinkWink.",
      },
      { property: "og:title", content: "Privacidad — WinkWink" },
      { property: "og:description", content: "Datos de facturas y derechos de privacidad." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LegalPage kind="privacy" />,
});
