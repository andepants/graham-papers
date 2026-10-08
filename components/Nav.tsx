import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/table-of-contents", label: "Read" },
  { href: "/was-pg-right", label: "Was PG right?" },
  { href: "/about", label: "About" },
];

export function Nav() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          The Grahamanack
        </Link>
        <nav aria-label="Main">
          <ul className="nav-list">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
