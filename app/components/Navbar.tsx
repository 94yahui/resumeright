"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import logo from "../../public/logo.png";
import Image from "next/image";

// ── Navbar ─────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    handler();
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
    border: "none",
    cursor: "pointer",
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? "rgba(250,250,250,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--paper3)"
          : "1px solid transparent",
        padding: "0 24px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.3s ease",
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: "22px",
          color: "var(--ink)",
          letterSpacing: "-0.5px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
          lineHeight: 1,
        }}
      >
        <Image src={logo} alt="Logo" width={30} style={{ display: "block" }} />
        <span
          style={{
            color: "black",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
          }}
        >
          ResumeRight
        </span>
      </Link>

      {/* Desktop nav */}
      <div
        className="nav-links"
        style={{ display: "flex", alignItems: "center", gap: "28px" }}
      >
        {[
          { label: "✦ Resume Analysis", href: "/#analysis" },
          { label: "Templates", href: "/#templates" },
          { label: "ATS Check", href: "/#ats" },
          { label: "Pricing", href: "/#pricing" },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--ink2)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink2)")}
          >
            {label}
          </a>
        ))}

        <Link
          href="/editor"
          className="nav-cta"
          style={{
            ...btnBase,
            background: "var(--ink)",
            color: "var(--paper)",
            padding: "10px 18px",
            textDecoration: "none",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--ink2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--ink)")
          }
        >
          Start for Free
        </Link>
      </div>

      {/* Mobile: start */}
      <div
        className="nav-mobile-cta"
        style={{ display: "none", alignItems: "center", gap: "8px" }}
      >
        <Link
          href="/editor"
          style={{
            ...btnBase,
            background: "var(--ink)",
            color: "var(--paper)",
            padding: "8px 16px",
            textDecoration: "none",
          }}
        >
          Start
        </Link>
      </div>
    </nav>
  );
}
