"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import blackLogo from "../../public/logo-black.png";
import whiteLogo from "../../public/logo-white.png";
import Image from 'next/image'
import { useAuth } from '../hooks/useAuth'
import WechatLoginModal from './WechatLoginModal'
import { UserDropdown, KickedOutModal } from './UserProfile'
import { clearLocalResumeData } from '../lib/storage'

// ── Navbar ─────────────────────────────────────────────────────────────────────
export default function Navbar({ onUploadClick }: { onUploadClick?: () => void }) {
  const [scrolled, setScrolled]       = useState(false);
  const [showLogin, setShowLogin]     = useState(false);
  const [showQrHint, setShowQrHint]   = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const auth = useAuth();
  const { loggedIn, loading, openid, nickname, avatar, membership, isStudent, freeAnalyzeUsed, kickedOut, logout, refresh } = auth;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    handler();
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Auto-show QR hint ~1s after auth resolves (desktop only)
  useEffect(() => {
    if (!loading && !loggedIn) {
      const show = setTimeout(() => {
        setShowQrHint(true);
        hintTimer.current = setTimeout(() => setShowQrHint(false), 5000);
      }, 900);
      return () => clearTimeout(show);
    }
  }, [loading, loggedIn]);

  // Auto-open login if redirected after logout (?auth=login)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.search.includes('auth=login')) {
      setShowLogin(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const onLoginEnter = () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setShowQrHint(true);
  };
  const onLoginLeave = () => {
    hintTimer.current = setTimeout(() => setShowQrHint(false), 200);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    refresh();
    window.dispatchEvent(new Event('rc:login'));
  };

  const handleLogout = async () => {
    clearLocalResumeData()
    await logout()
    window.location.replace('/')
  }

  const handleUpgrade = () => {
    window.location.href = '/#pricing'
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: '1', border: 'none', cursor: 'pointer',
    padding: '10px 16px', borderRadius: '8px',
    fontSize: '14px', fontWeight: 500,
  }

  return (
    <>
      {kickedOut && <KickedOutModal />}

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
            { label: 'ATS检测', href: '#ats' },
            { label: '升级会员', href: '#pricing' },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{
              fontSize: "14px", fontWeight: 500, color: "var(--ink2)",
              textDecoration: "none", transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--ink2)")}
            >{label}</a>
          ))}

          {/* Auth controls — shown immediately; useLayoutEffect applies cache before first paint */}
          {loggedIn
            ? (
              <UserDropdown
                avatar={avatar}
                nickname={nickname}
                openid={openid}
                membership={membership}
                isStudent={isStudent}
                freeAnalyzeUsed={freeAnalyzeUsed}
                onLogout={handleLogout}
                onUpgrade={handleUpgrade}
              />
            )
            : (
              /* Login button + QR hint tooltip */
              <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowLogin(true)}
                    onMouseEnter={onLoginEnter}
                    onMouseLeave={onLoginLeave}
                    style={{ ...btnBase, background: 'var(--highlight)', color: '#fff' }}
                  >登录</button>

                  {/* QR tooltip */}
                  <div
                    className="login-qr-hint"
                    onMouseEnter={onLoginEnter}
                    onMouseLeave={onLoginLeave}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: '-4px',
                      filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.13))',
                      opacity: showQrHint ? 1 : 0,
                      transition: 'opacity 0.45s ease',
                      pointerEvents: showQrHint ? 'auto' : 'none',
                      zIndex: 20,
                    }}
                  >
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderBottom: '7px solid #fff',
                      marginLeft: 'auto', marginRight: '18px',
                    }} />
                    <div style={{
                      background: '#fff', borderRadius: '10px',
                      padding: '10px 10px 8px', width: '138px', textAlign: 'center',
                    }}>
                      <Image
                        src="/wechat_qrcode.jpg" alt="公众号二维码"
                        width={108} height={108}
                        style={{ borderRadius: '5px', display: 'block', margin: '0 auto 7px' }}
                      />
                      <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.45 }}>
                        关注后发送<span style={{ fontWeight: 600, color: '#111' }}>「登录」</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
          }

          <Link href="/editor" className="nav-cta" style={{
            ...btnBase,
            background: "var(--ink)", color: "var(--paper)",
            padding: "10px 18px", textDecoration: "none",
            transition: "background 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--ink2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--ink)")}
          >{loggedIn ? '开始编辑' : '免费开始'}</Link>
        </div>

        {/* Mobile: login/user dropdown + start */}
        <div className="nav-mobile-cta" style={{ display: "none", alignItems: "center", gap: "8px" }}>
          {!loggedIn && (
            <button
              onClick={() => setShowLogin(true)}
              style={{
                ...btnBase,
                background: 'var(--highlight)', color: '#fff',
                padding: '8px 16px',
              }}
            >登录</button>
          )}
          {loggedIn && (
            <UserDropdown
              avatar={avatar}
              nickname={nickname}
              openid={openid}
              membership={membership}
              isStudent={isStudent}
              freeAnalyzeUsed={freeAnalyzeUsed}
              onLogout={handleLogout}
              onUpgrade={handleUpgrade}
            />
          )}
          <Link href="/editor" style={{
            ...btnBase,
            background: "var(--ink)", color: "var(--paper)",
            padding: "8px 16px", textDecoration: "none",
          }}>{loggedIn ? '开始编辑' : '开始'}</Link>
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
