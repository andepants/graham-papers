import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { EB_Garamond } from "next/font/google";
import { CursorFollower } from "@/components/CursorFollower";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { siteMetadata } from "@/lib/metadata";
import "./globals.css";

const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
});

export const metadata = siteMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${garamond.variable}`}
    >
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
        <CursorFollower />
      </body>
    </html>
  );
}
