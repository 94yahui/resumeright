"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logoWhite from "../../public/logo-white.png";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  BottomSheet,
  PrivacyContent,
  TermsContent,
  h2s,
  ps,
  uls,
  lis,
} from "./PolicySheets";

type Sheet = "about" | "privacy" | "terms" | "help" | null;

// ─── Sheet contents ───────────────────────────────────────────────────────────
function AboutContent() {
  return (
    <div>
      <p style={ps}>
        ResumeRight is an AI-powered online resume builder. We believe everyone
        should be able to present themselves professionally without wrestling
        with clunky layout software.
      </p>
      <h2 style={h2s}>What we offer</h2>
      <ul style={uls}>
        <li style={lis}>
          A large library of professional resume templates, all free, covering
          tech, finance, design, academia, and more
        </li>
        <li style={lis}>
          AI resume analysis: polishing + job-fit scoring + interview question
          prediction
        </li>
        <li style={lis}>
          Smart resume import: upload an existing PDF/Word resume and
          auto-extract its content into the editor
        </li>
        <li style={lis}>
          No account needed: open the app and start instantly — your data stays
          on your device
        </li>
      </ul>
      <h2 style={h2s}>Our philosophy</h2>
      <p style={ps}>
        We never sell user data to third parties. A resume is one of the most
        private documents a job seeker has — we process data only as needed to
        provide the service, and keep ownership with you.
      </p>
      <h2 style={h2s}>Contact</h2>
      <p style={{ ...ps, marginBottom: 0 }}>
        Email:{" "}
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

const FAQ_SECTIONS = [
  {
    cat: "Basics",
    items: [
      {
        q: "Is ResumeRight free?",
        a: "Yes. All templates, the online editor, and the AI features are completely free to use.",
      },
      {
        q: "Do I need to create an account?",
        a: "No. Just open the app and start. All your data is stored in your local browser by default — no sign-up required.",
      },
      {
        q: "Is my resume data uploaded to a server?",
        a: "Your resume content is stored only in your local browser and is not uploaded by default. When you use features like AI analysis or PDF download, the relevant content is temporarily sent to the server for processing, then released immediately and not retained.",
      },
      {
        q: "How do I save my resume?",
        a: 'The editor auto-saves a draft locally. You can also save manually; saved resumes appear in the "My Resumes" history list on the left, where you can switch between them.',
      },
    ],
  },
  {
    cat: "AI Features",
    items: [
      {
        q: "What can AI resume analysis do?",
        a: "AI analysis has two modes: 1) Polishing — without a job description, AI reviews each line and suggests stronger wording; 2) Job-targeted optimization — with a target job, AI scores your fit (interview chance prediction), suggests rewrites, and generates 10 interview questions. All changes are shown as highlighted diffs you can apply one by one.",
      },
      {
        q: "Where can I use AI analysis?",
        a: 'Two places: 1) the "Analyze my resume" section on the home page; 2) the "AI Improve" button in the editor top bar, whose results can be applied to your current resume in one click.',
      },
      {
        q: "Are there daily limits on AI features?",
        a: "No — AI analysis and the other AI tools are all free and unlimited.",
      },
    ],
  },
  {
    cat: "Download & Export",
    items: [
      {
        q: "How do I download a PDF?",
        a: 'Click the "Download" button in the top bar to download your resume as a PDF.',
      },
      {
        q: "What if PDF download fails?",
        a: "PDFs are generated server-side and usually take 5–15 seconds. If it fails, wait a moment and retry, or check your network connection.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #f1f5f9" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "14px 0",
          background: "none",
          border: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          textAlign: "left",
          gap: "12px",
          fontFamily: "var(--font-sans)",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#0f172a",
            lineHeight: 1.5,
          }}
        >
          {q}
        </span>
        {open ? (
          <ChevronUp size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
        ) : (
          <ChevronDown size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
        )}
      </button>
      {open && (
        <div
          style={{
            paddingBottom: "14px",
            fontSize: "13.5px",
            color: "#334155",
            lineHeight: 1.8,
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

function HelpContent() {
  return (
    <div>
      {FAQ_SECTIONS.map((section) => (
        <div key={section.cat} style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            {section.cat}
          </div>
          {section.items.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      ))}
      <div
        style={{
          marginTop: "24px",
          padding: "20px",
          background: "#f8fafc",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: "6px",
          }}
        >
          Still have questions?
        </div>
        <p
          style={{
            fontSize: "13px",
            color: "#64748b",
            marginBottom: "10px",
            lineHeight: 1.6,
            margin: "0 0 10px",
          }}
        >
          If you didn&apos;t find an answer above, email us — we usually reply
          within 1–2 business days.
        </p>
        <a
          href="mailto:839081822@qq.com"
          style={{
            display: "inline-block",
            padding: "8px 16px",
            borderRadius: "8px",
            background: "#0f172a",
            color: "white",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Send email
        </a>
      </div>
    </div>
  );
}

const SHEET_TITLES: Record<Exclude<Sheet, null>, string> = {
  about: "About",
  privacy: "Privacy Policy",
  terms: "Terms of Use",
  help: "Help Center",
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const LINKS: { label: string; id: Exclude<Sheet, null> }[] = [
  { label: "About", id: "about" },
  { label: "Privacy Policy", id: "privacy" },
  { label: "Terms of Use", id: "terms" },
  { label: "Help Center", id: "help" },
];

export default function Footer() {
  const [sheet, setSheet] = useState<Sheet>(null);

  return (
    <>
      <footer
        style={{
          background: "var(--ink)",
          color: "rgba(250,248,244,0.6)",
          padding: "48px 32px",
          fontSize: "13px",
        }}
      >
        <div
          className="footer-inner"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "20px",
              color: "var(--paper)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              lineHeight: 1,
              textDecoration: "none",
            }}
          >
            <Image
              src={logoWhite}
              alt="ResumeRight"
              width={26}
              style={{ display: "block" }}
            />
            <span style={{ display: "flex", alignItems: "center" }}>
              ResumeRight
            </span>
          </Link>
          <div style={{ display: "flex", gap: "24px" }}>
            {LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => setSheet(l.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(250,248,244,0.45)",
                  fontSize: "13px",
                  fontFamily: "var(--font-sans)",
                  padding: 0,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "var(--paper)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "rgba(250,248,244,0.45)")
                }
              >
                {l.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(250,248,244,0.3)" }}>
            © 2026 ResumeRight
          </div>
        </div>
      </footer>

      {LINKS.map((l) => (
        <BottomSheet
          key={l.id}
          open={sheet === l.id}
          title={SHEET_TITLES[l.id]}
          onClose={() => setSheet(null)}
        >
          {l.id === "about" && <AboutContent />}
          {l.id === "privacy" && <PrivacyContent />}
          {l.id === "terms" && <TermsContent />}
          {l.id === "help" && <HelpContent />}
        </BottomSheet>
      ))}
    </>
  );
}
