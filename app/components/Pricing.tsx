"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Star, GraduationCap } from "lucide-react";
import { getDeviceId, isFirstPurchase, getProStatus } from "../lib/payment";
import { PaywallModal, StudentModal } from "../editor/components/Modals";
import type { PaywallTrigger } from "../editor/components/Modals";
import { useAuth } from "../hooks/useAuth";

const FREE_FEATURES = [
  "基础模板（5 套）",
  "在线编辑",
  "PDF 下载（带水印）",
  "2 次免费 AI 简历优化",
  "ATS 检测 2 次",
];

const PRO_FEATURES = [
  "全部精美模板随心用",
  "无水印 PDF 下载",
  "AI 简历优化 20 次/天",
  "ATS 检测 5 次/天",
  "岗位匹配分析 & 面试题预测",
  "一键生成英文简历（5 次/天）",
  "一键 AI 压缩至 1 页",
  "简历智能导入（10 次/天）",
];

const SINGLE_FEATURES = [
  "解锁指定 1 套模板",
  "无水印 PDF 下载",
  "永久重新下载",
  "AI 简历优化 5 次",
  "ATS 检测 5 次",
];

const SUB_PLANS = [
  { key: "monthly", label: "月卡", price: 29, studentPrice: 14.9, saving: "" },
  {
    key: "quarterly",
    label: "季卡",
    price: 69,
    studentPrice: 34.9,
    saving: "省21%",
  },
  {
    key: "yearly",
    label: "年卡",
    price: 168,
    studentPrice: 84,
    saving: "省52%",
  },
] as const;

type SubPlanKey = (typeof SUB_PLANS)[number]["key"];

export default function Pricing({
  onLoginRequest,
}: {
  onLoginRequest: (afterLogin: () => void) => void;
}) {
  const router = useRouter();
  const auth = useAuth();
  const [selPlan, setSelPlan] = useState<SubPlanKey>("quarterly");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallTrigger, setPaywallTrigger] =
    useState<PaywallTrigger>("upgrade");
  const [studentOpen, setStudentOpen] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [isFirst, setIsFirst] = useState(true);

  // Student status: trust server when logged in; false when logged out
  const isStudent = auth.loggedIn && !auth.loading ? auth.isStudent : false;

  useEffect(() => {
    const did = getDeviceId();
    setDeviceId(did);
    setIsFirst(isFirstPurchase(did));
  }, []);

  // After in-page student verification, refresh auth so server truth is reflected
  useEffect(() => {
    function onVerified() {
      auth.refresh();
    }
    window.addEventListener("rc:studentVerified", onVerified);
    return () => window.removeEventListener("rc:studentVerified", onVerified);
  }, [auth.refresh]);

  const activePlan = SUB_PLANS.find((p) => p.key === selPlan)!;
  const displayPrice = isStudent ? activePlan.studentPrice : activePlan.price;
  const singlePrice = isFirst ? 0.99 : isStudent ? 4.9 : 9.9;

  function openPaywall(trigger: PaywallTrigger) {
    if (!auth.loggedIn) {
      onLoginRequest(() => {
        setPaywallTrigger(trigger);
        setPaywallOpen(true);
      });
      return;
    }
    setPaywallTrigger(trigger);
    setPaywallOpen(true);
  }

  function onPaySuccess() {
    setPaywallOpen(false);
    if (deviceId) setIsFirst(isFirstPurchase(deviceId));
    router.push("/editor");
  }

  return (
    <section
      id="pricing"
      style={{
        background: "#060d1a",
        padding: "88px 32px 72px",
      }}
    >
      <div
        style={{ textAlign: "center", marginBottom: "56px" }}
        className="fade-in"
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
            fontWeight: 500,
            marginBottom: "12px",
          }}
        >
          定价方案
        </div>
        <h2
          style={{
            fontSize: "clamp(26px, 4vw, 36px)",
            letterSpacing: "-1px",
            color: "white",
            margin: 0,
          }}
        >
          选择适合你的
          <em style={{ fontStyle: "italic", color: "var(--theme-blue)" }}>
            方案
          </em>
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            marginTop: "10px",
            fontWeight: 300,
            fontSize: "15px",
          }}
        >
          灵活选择，按需付费
        </p>
      </div>

      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          alignItems: "stretch",
        }}
        className="pricing-grid"
      >
        {/* ── Free ── */}
        <div className="fade-in" style={{ transitionDelay: "0s" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "32px 28px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginBottom: "20px",
              }}
            >
              免费版
            </div>
            <div style={{ marginBottom: "6px" }}>
              <span
                style={{
                  fontSize: "44px",
                  fontWeight: 800,
                  color: "white",
                  letterSpacing: "-2px",
                  lineHeight: 1,
                }}
              >
                ¥0
              </span>
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "28px",
              }}
            >
              永久免费
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {FREE_FEATURES.map((f) => (
                <li
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    fontSize: "13.5px",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <CheckCircle2
                    size={14}
                    color="rgba(255,255,255,0.35)"
                    style={{ flexShrink: 0 }}
                  />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/editor"
              style={{
                display: "block",
                marginTop: "28px",
                padding: "13px",
                borderRadius: "10px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                background: "transparent",
                color: "rgba(255,255,255,0.7)",
                border: "1.5px solid rgba(255,255,255,0.18)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              }}
            >
              立即开始
            </Link>
          </div>
        </div>

        {/* ── Pro (featured) ── */}
        <div className="fade-in" style={{ transitionDelay: "0.1s" }}>
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px 28px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              position: "relative",
              boxShadow:
                "0 0 0 2px var(--theme-blue), 0 20px 60px rgba(7,137,236,0.25)",
              transform: "scale(1.04)",
            }}
          >
            {/* Badge */}
            <div
              style={{
                position: "absolute",
                top: "-13px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--theme-blue)",
                color: "white",
                padding: "4px 16px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Star size={10} fill="white" strokeWidth={0} />
              求职季首选
            </div>

            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#94a3b8",
                marginBottom: "20px",
              }}
            >
              Pro 会员
            </div>

            {/* Plan selector */}
            <div
              style={{
                display: "flex",
                gap: "5px",
                background: "#f1f5f9",
                borderRadius: "8px",
                padding: "3px",
                marginBottom: "16px",
              }}
            >
              {SUB_PLANS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setSelPlan(p.key)}
                  style={{
                    flex: 1,
                    padding: "6px 4px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    fontSize: "11px",
                    fontWeight: 600,
                    transition: "all 0.15s",
                    background: selPlan === p.key ? "white" : "transparent",
                    color: selPlan === p.key ? "#0f172a" : "#94a3b8",
                    boxShadow:
                      selPlan === p.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Price */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "44px",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-2px",
                  lineHeight: 1,
                }}
              >
                ¥{displayPrice}
              </span>
              {isStudent && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "white",
                    background: "#0d9488",
                    borderRadius: "5px",
                    padding: "2px 7px",
                    marginBottom: "6px",
                  }}
                >
                  学生价
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#94a3b8",
                marginBottom: "24px",
              }}
            >
              <span>/{activePlan.label.replace("卡", "")}</span>
              {activePlan.saving && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#16a34a",
                    background: "#f0fdf4",
                    borderRadius: "4px",
                    padding: "1px 6px",
                  }}
                >
                  {activePlan.saving}
                </span>
              )}
            </div>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {PRO_FEATURES.map((f) => (
                <li
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    fontSize: "13.5px",
                    color: "#334155",
                  }}
                >
                  <CheckCircle2
                    size={14}
                    color="var(--theme-blue)"
                    style={{ flexShrink: 0 }}
                  />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => openPaywall("upgrade")}
              style={{
                display: "block",
                marginTop: "28px",
                padding: "14px",
                borderRadius: "10px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                background: "var(--theme-blue)",
                color: "white",
                border: "none",
                fontFamily: "var(--font-sans)",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0567c4";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--theme-blue)";
              }}
            >
              订阅 Pro
            </button>
          </div>
        </div>

        {/* ── Single ── */}
        <div className="fade-in" style={{ transitionDelay: "0.2s" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "32px 28px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginBottom: "20px",
              }}
            >
              单次购买
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "44px",
                  fontWeight: 800,
                  color: "white",
                  letterSpacing: "-2px",
                  lineHeight: 1,
                }}
              >
                ¥{singlePrice}
              </span>
              {isFirst && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "white",
                    background: "#ef4444",
                    borderRadius: "5px",
                    padding: "2px 8px",
                    alignSelf: "flex-end",
                    marginBottom: "6px",
                  }}
                >
                  首单特惠
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "28px",
              }}
            >
              /套模板 · 永久使用
            </div>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {SINGLE_FEATURES.map((f) => (
                <li
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    fontSize: "13.5px",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <CheckCircle2
                    size={14}
                    color="rgba(255,255,255,0.35)"
                    style={{ flexShrink: 0 }}
                  />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                const el = document.getElementById("templates");
                if (el)
                  window.scrollTo({
                    top: el.getBoundingClientRect().top + window.scrollY,
                    behavior: "smooth",
                  });
              }}
              style={{
                display: "block",
                width: "100%",
                marginTop: "28px",
                padding: "13px",
                borderRadius: "10px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: 600,
                background: "transparent",
                color: "rgba(255,255,255,0.7)",
                border: "1.5px solid rgba(255,255,255,0.18)",
                transition: "all 0.2s",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              }}
            >
              浏览模板
            </button>
          </div>
        </div>
      </div>

      {/* Student link */}
      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <button
          onClick={() => {
            if (!auth.loggedIn) {
              onLoginRequest(() => setStudentOpen(true));
              return;
            }
            setStudentOpen(true);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            color: "rgba(255,255,255,0.45)",
            fontFamily: "var(--font-sans)",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.45)";
          }}
        >
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            <GraduationCap size={16} />
            学生认证可享全场 5 折 →
          </span>
        </button>
      </div>

      {/* Modals */}
      {paywallOpen && deviceId && (
        <PaywallModal
          trigger={paywallTrigger}
          hideSingle
          deviceId={deviceId}
          isStudent={isStudent}
          isFirstOrder={isFirst}
          onClose={() => setPaywallOpen(false)}
          onSuccess={onPaySuccess}
          onOpenStudent={() => {
            setPaywallOpen(false);
            setStudentOpen(true);
          }}
        />
      )}

      {studentOpen && deviceId && (
        <StudentModal
          deviceId={deviceId}
          onClose={() => setStudentOpen(false)}
          onSuccess={() => {
            auth.refresh();
            if (deviceId) setIsFirst(isFirstPurchase(deviceId));
          }}
        />
      )}

      <style>{`
        @media (max-width: 720px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
