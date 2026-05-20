"use client";
import React from "react";
import Link from "next/link";
import { Upload, Pencil, Mail, Phone, Globe } from "lucide-react";

export default function Hero({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div
      style={{
        background: "linear-gradient(65deg,var(--ai-color-1), var(--gold2))",
        minHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingTop: "64px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }} />
      <section
        className="hero-section"
        style={{
          padding: "72px 32px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "center",
        }}
      >
        {/* Left */}
        <div className="fade-in">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--paper)",
              color: "black",
              fontSize: "12px",
              fontWeight: 500,
              padding: "4px 12px",
              borderRadius: "20px",
              marginBottom: "30px",
              boxShadow: " 0 0 2px 2px white",
            }}
          >
            <span style={{ color: "black", fontSize: "10px" }}>✦</span>
            AI 驱动 · 50+ 专业模板
          </div>

          <h1
            style={{
              fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
              fontSize: "clamp(34px, 5vw, 58px)",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              marginBottom: "30px",
            }}
          >
            <div style={{marginBottom: '15px'}}>
              打造
              <em
                style={{
                  fontStyle: "italic",
                  color: "var(--paper)",
                  marginRight: "12px",
                }}
              >
                令人印象
              </em>
            </div>
            <em
              style={{
                fontStyle: "italic",
                color: "var(--paper)",
                marginRight: "12px",
              }}
            >
              深刻
            </em>
            的简历
          </h1>

          <p
            style={{
              fontSize: "17px",
              lineHeight: 1.7,
              color: "var(--paper)",
              marginBottom: "36px",
              fontWeight: 300,
            }}
          >
            从选择模板到 AI 优化内容，只需几分钟，
            <br />
            创建一份脱颖而出的专业简历
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/editor"
              style={{
                background: "black",
                color: "var(--paper)",
                border: "none",
                padding: "14px 28px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              创建简历 <span style={{ fontSize: "16px" }}>→</span>
            </Link>

            <button
              onClick={onUploadClick}
              style={{
                background: "transparent",
                color: "var(--paper)",
                border: "1.5px solid var(--paper)",
                padding: "13px 24px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 400,
                cursor: "pointer",
                fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--theme-blue)";
                // e.currentTarget.style.color = 'var(--ink)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--paper)";
              }}
            >
              <Upload size={15} /> 上传已有简历
            </button>
          </div>

          {/* Stats */}
          <div
            className="hero-stats"
            style={{ display: "flex", gap: "32px", marginTop: "44px" }}
          >
            {[
              { num: "50+", label: "专业模板" },
              { num: "50k+", label: "用户使用" },
              { num: "98%", label: "好评率" },
            ].map((s) => (
              <div
                key={s.label}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
                    fontSize: "28px",
                    color: "var(--paper)",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {s.num}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--paper2)",
                    marginTop: "2px",
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Resume preview card */}
        <div
          className="hero-right fade-in"
          style={{ position: "relative", transitionDelay: "0.2s" }}
        >
          <style>{`
            @keyframes heroTilt5 {
              from { transform: rotate(0deg); }
              to   { transform: rotate(5deg); }
            }
            @keyframes heroTilt2 {
              from { transform: rotate(0deg); }
              to   { transform: rotate(2deg); }
            }
          `}</style>
          {/* Stacked background cards */}
          <div style={{
            position: "absolute",
            top: "16px", left: "16px", right: "-16px", bottom: "-16px",
            background: "rgba(255,255,255,0.45)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: "0 6px 24px rgba(26,24,20,0.08)",
            animation: "heroTilt5 0.9s cubic-bezier(0.34,1.56,0.64,1) .5s both",
            zIndex: 0,
          }} />
          <div style={{
            position: "absolute",
            top: "8px", left: "8px", right: "-8px", bottom: "-8px",
            background: "rgba(255,255,255,0.65)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 6px 20px rgba(26,24,20,0.08)",
            animation: "heroTilt2 0.7s cubic-bezier(0.34,1.56,0.64,1) .6s both",
            zIndex: 1,
          }} />

          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              boxShadow:
                "0 16px 50px rgba(26,24,20,0.18), 0 4px 12px rgba(26,24,20,0.08)",
              overflow: "hidden",
              border: "1px solid var(--paper3)",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                background: "var(--ink)",
                padding: "28px 32px 24px",
                color: "white",
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
                  fontSize: "24px",
                  marginBottom: "4px",
                }}
              >
                陈梦瑶
              </div>
              <div
                style={{
                  fontSize: "13px",
                  opacity: 0.6,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  fontWeight: 300,
                }}
              >
                资深产品经理
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  marginTop: "14px",
                  flexWrap: "wrap",
                  border: "1px var(--theme-blue) solid",
                  padding: "2px",
                  borderRadius: "4px",
                }}
              >
                {(
                  [
                    { Icon: Mail, text: "meng@example.com", href: "mailto:meng@example.com" },
                    { Icon: Phone, text: "138 0000 0000", href: "tel:13800000000" },
                    { Icon: Globe, text: "portfolio.io", href: "https://portfolio.io" },
                  ] as { Icon: React.ElementType; text: string; href: string }[]
                ).map(({ Icon, text, href }) => (
                  <a
                    key={text}
                    href={href}
                    onClick={(e) => e.preventDefault()}
                    style={{
                      fontSize: "11px",
                      opacity: 0.7,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    <Icon size={10} /> {text}
                  </a>
                ))}
              </div>
            </div>
            <div style={{ padding: "24px 32px 32px" }}>
              {[
                { label: "工作经历", bars: [100, 85, 65, 90, 70] },
                { label: "项目经历", bars: [100, 75, 55] },
                { label: "教育背景", bars: [100, 70] },
              ].map((sec, i) => (
                <div key={sec.label} style={{ marginBottom: i < 2 ? "22px" : "18px" }}>
                  <div style={{
                    fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
                    color: "var(--ink3)", fontWeight: 600,
                    borderBottom: "1px solid var(--paper3)",
                    paddingBottom: "6px", marginBottom: "10px",
                  }}>
                    {sec.label}
                  </div>
                  {sec.bars.map((w, j) => (
                    <div key={j} style={{
                      height: "7px", background: "var(--paper2)",
                      borderRadius: "3px", marginBottom: "5px", width: `${w}%`,
                    }} />
                  ))}
                </div>
              ))}
              <div>
                <div style={{
                  fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
                  color: "var(--ink3)", fontWeight: 600,
                  borderBottom: "1px solid var(--paper3)",
                  paddingBottom: "6px", marginBottom: "10px",
                }}>专业技能</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {[60, 70, 50, 80, 55, 65].map((w, j) => (
                    <div key={j} style={{
                      height: "18px", width: `${w}px`,
                      background: "var(--paper2)", borderRadius: "12px",
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className="animate-float"
            style={{
              position: "absolute",
              zIndex: 5,
              top: "90px",
              right: "-16px",
              background: "var(--theme-blue)",
              color: "var(--paper)",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 500,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(26,24,20,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pencil
              size={12}
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: "4px",
              }}
            />{" "}
            点击任意模块开始编辑
            <div
              style={{
                position: "absolute",
                left: "-6px",
                top: "50%",
                transform: "translateY(-50%)",
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                borderRight: "6px solid var(--theme-blue)",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              zIndex: 5,
              bottom: "-20px",
              left: "50%",
              transform: "translateX(-50%)",
              background:
                "linear-gradient(135deg, #6d28d9, #0ea5e9)",
              color: "white",
              padding: "8px 18px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 20px rgba(45,125,110,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            <div
              className="animate-pulse-dot"
              style={{
                width: "6px",
                height: "6px",
                background: "white",
                borderRadius: "50%",
              }}
            />
            AI 正在优化您的描述...
          </div>
        </div>
      </section>
    </div>
  );
}
