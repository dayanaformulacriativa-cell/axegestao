import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "AxéGestão — Gestão para casas de candomblé e axé" },
      {
        name: "description",
        content:
          "AxéGestão: aplicativo simples e seguro para sacerdotes e filhos de santo organizarem a casa de axé.",
      },
      { name: "theme-color", content: "#fafaf7" },
      { property: "og:title", content: "AxéGestão — Gestão para casas de candomblé e axé" },
      { property: "og:description", content: "AxéCasa Gestão is a mobile app for managing Candomblé and Axé houses." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "AxéGestão — Gestão para casas de candomblé e axé" },
      { name: "description", content: "AxéCasa Gestão is a mobile app for managing Candomblé and Axé houses." },
      { name: "twitter:description", content: "AxéCasa Gestão is a mobile app for managing Candomblé and Axé houses." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/VvAqzZOU74hk0xDt3DeU4jtiq7x1/social-images/social-1777332086225-2.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/VvAqzZOU74hk0xDt3DeU4jtiq7x1/social-images/social-1777332086225-2.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://cdn.gpteng.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://cdn.gpteng.co" },
      { rel: "preconnect", href: "https://bvokuneyglqhxqwajzik.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://bvokuneyglqhxqwajzik.supabase.co" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}
