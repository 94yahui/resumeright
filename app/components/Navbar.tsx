"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import blackLogo from "../../public/logo-black.png";
import whiteLogo from "../../public/logo-white.png";
import Image from 'next/image'

export default function Navbar({ onUploadClick }: { onUploadClick?: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    handler(); // sync initial state in case page loads already scrolled
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(250,250,250,0.88)" : "transparent",
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
        <Image src={scrolled? blackLogo : whiteLogo} alt="Logo" width={30} />
        <span style={{color: scrolled ? 'black' : 'white', fontWeight: 500}}>简力全开</span>
      </Link>

      {/* Desktop nav */}
      <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        {[
          { label: '简历优化✦', href: '#analysis' },
          { label: '模板', href: '#templates' },
          { label: 'AI功能', href: '#ai' },
          { label: '定价', href: '#pricing' },
        ].map(({ label, href }) => (
          <a key={label} href={href} style={{
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
