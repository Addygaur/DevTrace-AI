import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevTrace AI — Engineering Memory Agent",
  description:
    "Persistent engineering memory for software teams. Powered by CockroachDB and Amazon Bedrock.",
};

const links = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/memories", label: "Memories" },
  { href: "/remember", label: "Remember" },
  { href: "/impact", label: "Impact" },
  { href: "/stack", label: "Stack" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <div className="container">
            <nav className="nav">
              <Link href="/" className="brand">
                <div className="brand-mark">
                  Dev<span>Trace</span>
                </div>
                <div className="brand-sub">Engineering memory agent</div>
              </Link>
              <div className="nav-links">
                {links.map((l) => (
                  <Link key={l.href} href={l.href}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </nav>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
