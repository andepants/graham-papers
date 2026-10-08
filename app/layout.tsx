import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { siteMetadata } from "@/lib/metadata";
import "./globals.css";

export const metadata = siteMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
