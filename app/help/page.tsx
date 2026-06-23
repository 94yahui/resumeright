"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQ = [
  {
    cat: "Basics",
    items: [
      {
        q: "Is ResumeRight free?",
        a: "Yes. All templates, the online editor, PDF download, module drag-and-drop, and the AI features are completely free.",
      },
      {
        q: "Do I need to create an account?",
        a: "No. ResumeRight is device-based — just open the app and start. All your data is stored in your local browser, no account required.",
      },
      {
        q: "Is my resume data uploaded to a server?",
        a: "Your resume content is stored in your local browser (localStorage) and is not uploaded by default. Only when you use features like AI analysis or PDF download is the relevant content temporarily sent to the server for processing, then released immediately and not retained.",
      },
      {
        q: "How do I save my resume?",
        a: 'The editor auto-saves your latest draft locally. You can also save manually; saved resumes appear in the "My Resumes" history list on the left. Data is stored locally, so clearing your browser data will remove it.',
      },
    ],
  },
  {
    cat: "Templates & Design",
    items: [
      {
        q: "How do I switch templates?",
        a: 'Open the "Templates" tab in the left panel of the editor to browse and click to switch. Switching templates keeps your content and only changes the look. All templates are free to use.',
      },
      {
        q: "How do I change the template color?",
        a: 'Open the "Colors" tab in the left panel to pick from preset theme colors or set a custom one. Color only affects the current resume.',
      },
      {
        q: "How do I add a photo?",
        a: 'Find "Photo" in the "Modules" tab on the left, then upload an image — you can crop and reposition it. Some templates have no photo area by default; choose a layout that includes a photo.',
      },
      {
        q: "How many pages does a resume have, and what if it overflows?",
        a: 'The editor paginates content automatically and the bottom toolbar shows the page count. Aim for 1–2 pages. If there is too much content, trim descriptions or hide unneeded modules in the "Modules" tab.',
      },
    ],
  },
  {
    cat: "AI Features",
    items: [
      {
        q: "What can AI resume analysis do?",
        a: "AI analysis has two modes: (1) Polishing — without a job description, AI reviews each line and suggests stronger wording; (2) Job-targeted optimization — with a target job, AI scores your fit (interview chance prediction), suggests rewrites, and generates 10 interview questions. All changes are shown as highlighted diffs you can apply or ignore one by one.",
      },
      {
        q: "Where can I use AI analysis?",
        a: 'Two places: (1) the "Analyze my resume" section on the home page, where you can upload or paste a resume without opening the editor; (2) the "AI Improve" button in the editor top bar, whose results can be applied to your current resume in one click.',
      },
      {
        q: "Can AI parse my old resume?",
        a: 'Yes. Click "Upload resume" in the editor top bar, choose your PDF or Word file, and AI will extract the content and fill the editor. The parsed resume behaves just like one you typed and can be edited further.',
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
    <div style={{ borderBottom: "1px solid #e2e8f0" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "16px 0",
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
            fontSize: "15px",
            fontWeight: 600,
            color: "#0f172a",
            lineHeight: 1.5,
          }}
        >
          {q}
        </span>
        {open ? (
          <ChevronUp size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
        ) : (
          <ChevronDown size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
        )}
      </button>
      {open && (
        <div
          style={{
            paddingBottom: "16px",
            fontSize: "14px",
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

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <main
        style={{
          background: "#f8fafc",
          minHeight: "100vh",
          paddingTop: "80px",
        }}
      >
        <div
          style={{ maxWidth: "760px", margin: "0 auto", padding: "64px 32px" }}
        >
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: "8px",
              letterSpacing: "-1px",
            }}
          >
            Help Center
          </h1>
          <p
            style={{ color: "#64748b", marginBottom: "48px", fontSize: "15px" }}
          >
            Frequently asked questions to help you get started with ResumeRight
          </p>

          {FAQ.map((section) => (
            <div key={section.cat} style={{ marginBottom: "40px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                {section.cat}
              </h2>
              {section.items.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          ))}

          <div
            style={{
              marginTop: "48px",
              padding: "24px",
              background: "white",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: "6px",
              }}
            >
              Still have questions?
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "12px",
                lineHeight: 1.6,
              }}
            >
              If you didn't find an answer above, email us — we usually reply
              within 1–2 business days.
            </p>
            <a
              href="mailto:839081822@qq.com"
              style={{
                display: "inline-block",
                padding: "10px 20px",
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

          <div
            style={{
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <Link
              href="/"
              style={{
                color: "#0789ec",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
