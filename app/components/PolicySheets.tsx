"use client";
import { useRef, useState } from "react";
import { X } from "lucide-react";

// ─── Shared prose styles ─────────────────────────────────────────────────────
export const h2s: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#0f172a",
  margin: "28px 0 10px",
};
export const h3s: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#334155",
  margin: "16px 0 6px",
};
export const ps: React.CSSProperties = {
  color: "#334155",
  lineHeight: 1.8,
  marginBottom: "12px",
  fontSize: "14px",
};
export const uls: React.CSSProperties = {
  paddingLeft: "18px",
  margin: "0 0 12px",
};
export const lis: React.CSSProperties = {
  color: "#334155",
  lineHeight: 1.8,
  marginBottom: "4px",
  fontSize: "14px",
};

// ─── Sheet contents ───────────────────────────────────────────────────────────
export function PrivacyContent() {
  return (
    <div>
      <p style={ps}>
        ResumeRight takes your privacy seriously. This policy explains what we
        collect, how we use it, and how we protect it.
      </p>
      <h2 style={h2s}>1. What we collect</h2>
      <h3 style={h3s}>Device ID</h3>
      <p style={ps}>
        A random per-device UUID stored in your browser via cookies and
        localStorage. It only distinguishes devices and tracks usage for abuse
        prevention, and contains no personally identifiable information.
      </p>
      <h3 style={h3s}>Resume content</h3>
      <p style={ps}>
        Your resume data is stored locally in your browser. There are no
        accounts. The features below temporarily send your content to a
        third-party AI provider for processing; it is released immediately after
        and not retained by us:
      </p>
      <ul style={uls}>
        <li style={lis}>
          AI resume analysis (sent to our AI provider&apos;s API)
        </li>
        <li style={lis}>
          Smart resume import (text extracted from PDF/Word, then forwarded to
          the AI model)
        </li>
        <li style={lis}>
          PDF download (HTML content sent to the server to render the PDF)
        </li>
      </ul>
      <h2 style={h2s}>2. Cookies &amp; local storage</h2>
      <p style={ps}>
        We use a cookie to store the device ID and use localStorage to keep your
        resume drafts and local preferences. We use no third-party tracking
        cookies and integrate no advertising SDKs.
      </p>
      <h2 style={h2s}>3. Third-party services</h2>
      <ul style={uls}>
        <li style={lis}>
          <strong>AI provider</strong>: powers the AI features and is governed
          by its own privacy policy
        </li>
        <li style={lis}>
          <strong>Vercel</strong>: website hosting, which may record basic
          access logs
        </li>
      </ul>
      <h2 style={h2s}>4. Contact</h2>
      <p style={{ ...ps, marginBottom: 0 }}>
        Questions?{" "}
        <a
          href="mailto:839081822@qq.com"
          style={{ color: "#0789ec", textDecoration: "none" }}
        >
          839081822@qq.com
        </a>
      </p>
    </div>
  );
}

export function TermsContent() {
  return (
    <div>
      <p style={{ ...ps, color: "#64748b", fontSize: "13px" }}>
        Last updated: June 1, 2026
      </p>
      <p style={ps}>
        By using ResumeRight you agree to be bound by the following terms.
      </p>
      <h2 style={h2s}>1. The service</h2>
      <p style={ps}>
        ResumeRight provides online resume building, AI resume analysis, and
        related tools. All features are free to use.
      </p>
      <h2 style={h2s}>2. Accounts</h2>
      <p style={ps}>
        No account or registration is required — just open the app and start.
        Your resume data is stored locally in your browser, so clearing your
        browser data or switching devices may remove it. Export your resumes to
        keep your own copies.
      </p>
      <h2 style={h2s}>3. Acceptable use</h2>
      <ul style={uls}>
        <li style={lis}>
          Do not upload or process illegal, infringing, or confidential content
        </li>
        <li style={lis}>
          Do not use technical means to bypass usage limits or abuse the service
        </li>
        <li style={lis}>
          Do not use AI output for academic fraud, misrepresentation, or other
          dishonest purposes
        </li>
      </ul>
      <h2 style={h2s}>4. Intellectual property</h2>
      <p style={ps}>
        Template designs, code, and the logo belong to ResumeRight. The resume
        content you create with the product belongs to you.
      </p>
      <h2 style={h2s}>5. Demo content notice</h2>
      <p style={ps}>
        The sample resumes shown across the product (home page, template
        previews, etc.) use fictional names such as &quot;Emma Carter&quot; that
        do not represent any real person, and sample photos are AI-generated and
        do not correspond to any real individual. If you believe any content
        infringes your rights, please contact us and we will address it
        promptly.
      </p>
      <h2 style={h2s}>6. Disclaimer</h2>
      <p style={ps}>
        AI suggestions are for reference only and do not constitute professional
        HR advice. We are not responsible for job-search outcomes resulting from
        resumes created with this product.
      </p>
      <h2 style={h2s}>7. Contact</h2>
      <p style={{ ...ps, marginBottom: 0 }}>
        <a
          href="mailto:839081822@qq.com"
          style={{ color: "#0789ec", textDecoration: "none" }}
        >
          839081822@qq.com
        </a>
      </p>
    </div>
  );
}

// ─── Bottom sheet ─────────────────────────────────────────────────────────────
export function BottomSheet({
  open,
  title,
  onClose,
  children,
  zIndex = 200,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: number;
}) {
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const dragging = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    setDragY(delta);
  };
  const onTouchEnd = () => {
    dragging.current = false;
    if (dragY > 80) onClose();
    setDragY(0);
  };

  const sliding = dragY > 0;
  const translateY = !open ? "100%" : sliding ? `${dragY}px` : "0";

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex,
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: open ? "auto" : "none",
        }}
      />
      <div
        className="bottom-sheet-panel"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 0,
          zIndex: zIndex + 1,
          width: "min(720px, calc(100vw - 48px))",
          transform: "translateX(-50%)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div
          style={{
            transform: `translateY(${translateY})`,
            transition: sliding
              ? "none"
              : "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
            display: "flex",
            flexDirection: "column",
            background: "white",
            borderRadius: "20px 20px 0 0",
            maxHeight: "82vh",
          }}
        >
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 8px",
              cursor: "grab",
              touchAction: "none",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "4px",
                borderRadius: "2px",
                background: "#e2e8f0",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 20px 14px",
              borderBottom: "1px solid #f1f5f9",
              flexShrink: 0,
            }}
          >
            <div
              style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a" }}
            >
              {title}
            </div>
            <button
              onClick={onClose}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: "none",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ overflowY: "auto", padding: "20px", flex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
