import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import DevRoleSwitcher from "@/components/dev/DevAuthPanel";

export const metadata: Metadata = {
  title: "Gourmetify",
  description: "App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {/* <DevRoleSwitcher /> */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
