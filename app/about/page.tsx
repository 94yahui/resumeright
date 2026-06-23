import Link from "next/link";
import Navbar from "../components/Navbar";

export const metadata = { title: "About — ResumeRight" };

export default function AboutPage() {
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
            About
          </h1>
          <p
            style={{ color: "#64748b", marginBottom: "48px", fontSize: "15px" }}
          >
            ResumeRight
          </p>

          <section style={{ marginBottom: "40px" }}>
            <h2 style={h2}>Who we are</h2>
            <p style={p}>
              ResumeRight is an AI-powered online resume builder. We believe
              everyone should be able to present themselves professionally,
              without wrestling with clunky layout software.
            </p>
            <p style={p}>
              Our team of engineers and product people who love AI and design is
              on a mission to turn resume writing — something hard but important
              — into an easy, efficient, and rewarding experience.
            </p>
          </section>

          <section style={{ marginBottom: "40px" }}>
            <h2 style={h2}>What we offer</h2>
            <p style={p}>ResumeRight provides:</p>
            <ul style={ul}>
              <li style={li}>
                Professional resume templates covering tech, finance, design,
                academia, and more
              </li>
              <li style={li}>
                AI content optimization: rewrite work/project descriptions in
                one click to be more quantified and persuasive
              </li>
              <li style={li}>
                Job match analysis: paste a target job and AI scores your fit
                and gives targeted suggestions
              </li>
              <li style={li}>
                Smart resume parsing: upload an existing PDF/Word resume and
                auto-extract its content into the editor
              </li>
              <li style={li}>
                No-account experience: device-based, no sign-up required, with
                data stored locally to protect your privacy
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: "40px" }}>
            <h2 style={h2}>Our philosophy</h2>
            <p style={p}>
              We don&apos;t collect personal account information, don&apos;t
              rely on social login, and don&apos;t sell data to third parties. A
              resume is one of the most private documents a job seeker has — we
              keep ownership with you.
            </p>
            <p style={p}>
              We also believe good tools should be transparent and accessible.
              ResumeRight is free to use.
            </p>
          </section>

          <section>
            <h2 style={h2}>Contact</h2>
            <p style={p}>
              For any questions, suggestions, or partnership inquiries, reach us
              at:
            </p>
            <p style={{ ...p, marginBottom: 0 }}>
              Email:{" "}
              <a
                href="mailto:839081822@qq.com"
                style={{ color: "#0789ec", textDecoration: "none" }}
              >
                839081822@qq.com
              </a>
            </p>
          </section>

          <div
            style={{
              marginTop: "48px",
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

const h2: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: "14px",
};
const p: React.CSSProperties = {
  color: "#334155",
  lineHeight: 1.8,
  marginBottom: "14px",
  fontSize: "15px",
};
const ul: React.CSSProperties = { paddingLeft: "20px", margin: "0 0 14px" };
const li: React.CSSProperties = {
  color: "#334155",
  lineHeight: 1.8,
  marginBottom: "6px",
  fontSize: "15px",
};
