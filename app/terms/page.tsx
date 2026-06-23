import Link from "next/link";
import Navbar from "../components/Navbar";

export const metadata = { title: "Terms of Use — ResumeRight" };

export default function TermsPage() {
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
            Terms of Use
          </h1>
          <p
            style={{ color: "#64748b", marginBottom: "48px", fontSize: "14px" }}
          >
            Last updated: January 1, 2026
          </p>

          <p style={p}>
            Welcome to ResumeRight. Please read these terms carefully before
            using the product. By using ResumeRight you agree to be bound by
            these terms.
          </p>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>1. The service</h2>
            <p style={p}>
              ResumeRight provides online resume building, AI content
              optimization, job match analysis, and related tools. All features
              are free to use.
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>2. Accounts</h2>
            <p style={p}>
              No account or registration is required. We distinguish devices
              with a browser device identifier (Device ID). Your resume data is
              stored locally in your browser, so switching devices or clearing
              browser data may remove it. Export your resumes to keep your own
              copies.
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>3. Acceptable use</h2>
            <p style={p}>You agree not to:</p>
            <ul style={ul}>
              <li style={li}>
                Upload or process any illegal, infringing, or confidential
                content
              </li>
              <li style={li}>
                Use technical means to bypass usage limits or abuse the service
              </li>
              <li style={li}>
                Use AI output for academic fraud, misrepresentation, or other
                dishonest purposes
              </li>
              <li style={li}>
                Reverse engineer, scrape, or automate abuse of the product
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>4. Intellectual property</h2>
            <p style={p}>
              The product&apos;s template designs, code, logo, and branding
              belong to ResumeRight and may not be copied or used commercially
              without written permission.
            </p>
            <p style={p}>
              The resume content you create with the product (including
              AI-optimized text) belongs to you; we claim no rights over it.
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>5. Changes &amp; interruptions</h2>
            <p style={p}>
              We reserve the right to modify, suspend, or discontinue part or
              all of the service at any time, and will give advance notice of
              major changes. We are not liable for interruptions caused by force
              majeure (server failures, third-party API outages, etc.), but will
              restore service as soon as possible.
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>6. Disclaimer</h2>
            <p style={p}>
              AI suggestions are for reference only and do not constitute
              professional HR advice. The final quality of your resume is your
              own responsibility. We are not liable for job-search outcomes
              resulting from resumes created with this product.
            </p>
          </section>

          <section>
            <h2 style={h2}>7. Changes to these terms</h2>
            <p style={p}>
              We reserve the right to modify these terms at any time. Continuing
              to use the product after changes means you accept the new terms.
              Questions? Contact{" "}
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
  marginBottom: "12px",
  marginTop: "4px",
};
const h3: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#334155",
  marginBottom: "8px",
  marginTop: "16px",
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
