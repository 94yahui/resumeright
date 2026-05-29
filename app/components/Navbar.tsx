"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import blackLogo from "../../public/logo-black.png";
import whiteLogo from "../../public/logo-white.png";
import Image from 'next/image'
import { useAuth } from '../hooks/useAuth'
import WechatLoginModal from './WechatLoginModal'

export default function Navbar({ onUploadClick }: { onUploadClick?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { loggedIn, loading, logout, refresh } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    handler();
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleLoginSuccess = () => {
    setShowLogin(false);
    refresh();
  };

  return (
    <>
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
          <Image src={scrolled ? blackLogo : whiteLogo} alt="Logo" width={30} />
          <span style={{ color: scrolled ? 'black' : 'white', fontWeight: 500 }}>简力全开</span>
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

          {/* Auth controls */}
          {!loading && (
            loggedIn
              ? <button
                  onClick={logout}
                  style={{
                    background: 'none', border: '1px solid var(--paper3)',
                    color: 'var(--ink2)', padding: '7px 14px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ink)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--paper3)')}
                >退出登录</button>
              : <button
                  onClick={() => setShowLogin(true)}
                  style={{
                    background: 'none', border: '1px solid var(--paper3)',
                    color: 'var(--ink2)', padding: '7px 14px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ink)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--paper3)')}
                >登录</button>
          )}

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

        {/* Mobile: login + start */}
        <div className="nav-mobile-cta" style={{ display: "none", alignItems: "center", gap: "8px" }}>
          {!loading && !loggedIn && (
            <button
              onClick={() => setShowLogin(true)}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.5)',
                color: scrolled ? 'var(--ink2)' : 'white',
                padding: '6px 12px', borderRadius: '8px',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
            >登录</button>
          )}
          {!loading && loggedIn && (
            <button
              onClick={logout}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.5)',
                color: scrolled ? 'var(--ink2)' : 'white',
                padding: '6px 12px', borderRadius: '8px',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
            >退出</button>
          )}
          <Link href="/editor" style={{
            background: "var(--ink)", color: "var(--paper)",
            padding: "7px 16px", borderRadius: "8px",
            fontSize: "13px", fontWeight: 500, textDecoration: "none",
          }}>开始</Link>
        </div>
      </nav>

      {showLogin && (
        <WechatLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}
