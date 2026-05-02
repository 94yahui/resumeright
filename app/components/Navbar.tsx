"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import logo from "../../public/resume-logo.png";
import Image from 'next/image'

export default function Navbar({ onUploadClick }: { onUploadClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(250,248,244,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? "1px solid var(--paper3)" : "1px solid transparent",
      padding: "0 24px", height: "60px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: "all 0.3s ease",
    }}>
      <Link href="/" style={{
        fontSize: "22px", color: "var(--ink)", letterSpacing: "-0.5px",
        display: "flex", alignItems: "center", gap: "8px",
        textDecoration: "none",
      }}>
        <Image src={logo} alt="Logo" width={30} />
        简历帮
      </Link>

      {/* Desktop nav */}
      <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        {(["模板", "编辑器", "AI功能", "定价"] as const).map((label, i) => (
          <a key={label} href={`#${["templates", "editor", "ai", "pricing"][i]}`} style={{
            fontSize: "14px", fontWeight: 500, color: "var(--ink2)",
            textDecoration: "none", transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--ink2)")}
          >{label}</a>
        ))}
        <Link href="/editor" className="nav-cta" style={{
          background: "var(--ink)", color: "var(--paper)",
          padding: "8px 18px", borderRadius: "8px",
          fontSize: "13px", fontWeight: 500,
          textDecoration: "none", transition: "background 0.2s", display: "inline-block",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--ink2)")}
        onMouseLeave={e => (e.currentTarget.style.background = "var(--ink)")}
        >免费开始</Link>
      </div>

      {/* Mobile CTA */}
      <Link href="/editor" className="nav-mobile-cta" style={{
        display: "none",
        background: "var(--ink)", color: "var(--paper)",
        padding: "7px 16px", borderRadius: "8px",
        fontSize: "13px", fontWeight: 500, textDecoration: "none",
      }}>开始</Link>
    </nav>
  );
}
