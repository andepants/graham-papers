import { SiteMotion } from "@/components/SiteMotion";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { siteMetadata } from "@/lib/metadata";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-loaded",
  display: "swap",
});

export const metadata = siteMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <SiteMotion />
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
