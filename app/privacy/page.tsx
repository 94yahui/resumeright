import Link from "next/link";
import Navbar from "../components/Navbar";

export const metadata = { title: "Privacy Policy — ResumeRight" };

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p
            style={{ color: "#64748b", marginBottom: "48px", fontSize: "14px" }}
          >
            Last updated: January 1, 2026
          </p>

          <p style={p}>
            ResumeRight (&quot;the product&quot; or &quot;we&quot;) takes your
            privacy seriously. This policy explains what we collect, how we use
            it, and how we protect it.
          </p>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>1. What we collect</h2>
            <h3 style={h3}>Device ID</h3>
            <p style={p}>
              Instead of user accounts, the product uses a random per-device
              identifier (UUID), stored in your browser via cookies and
              localStorage. It only distinguishes devices and tracks usage for
              abuse prevention, and contains no personally identifiable
              information.
            </p>
            <h3 style={h3}>Resume content</h3>
            <p style={p}>
              The resume content you enter in the editor is stored only in your
              local browser (localStorage) and is not uploaded to our servers by
              default. When you use the following features, the relevant content
              is temporarily sent to the server for processing:
            </p>
            <ul style={ul}>
              <li style={li}>
                <strong>AI content optimization</strong>: your work/project
                descriptions or summary are sent to our AI provider&apos;s API
                for processing
              </li>
              <li style={li}>
                <strong>Job match analysis</strong>: your structured resume data
                and the job description are sent to our AI provider&apos;s API
                for analysis
              </li>
              <li style={li}>
                <strong>Resume parsing</strong>: the PDF/Word file you upload is
                sent to the server for text extraction, then forwarded to the AI
                model
              </li>
              <li style={li}>
                <strong>PDF download</strong>: your resume HTML is sent to the
                server to render the PDF
              </li>
            </ul>
            <p style={p}>
              All of the above is one-time processing; the server does not
              retain your resume data afterward.
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>2. How we use information</h2>
            <p style={p}>Collected information is used only to:</p>
            <ul style={ul}>
              <li style={li}>
                Provide the AI features (optimization, analysis, parsing)
              </li>
              <li style={li}>Improve product features and user experience</li>
              <li style={li}>Prevent abuse (e.g. API rate limiting)</li>
            </ul>
            <p style={p}>
              We never sell your information to third parties, and never use it
              for advertising or profiling.
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>3. Cookies &amp; local storage</h2>
            <p style={p}>
              We use a cookie and localStorage to store the device ID and your
              edit history so they persist on the same device. Clearing your
              browser data may remove these records.
            </p>
            <p style={p}>
              We use no third-party tracking cookies and integrate no
              advertising SDKs.
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>4. Third-party services</h2>
            <p style={p}>
              The product uses the following third-party services:
            </p>
            <ul style={ul}>
              <li style={li}>
                <strong>AI provider</strong>: the underlying model behind the AI
                features, governed by its own privacy policy
              </li>
              <li style={li}>
                <strong>Google Fonts</strong>: font delivery; your IP address
                may be recorded by Google
              </li>
              <li style={li}>
                <strong>Vercel</strong>: website hosting, which may record basic
                access logs
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>5. Data security</h2>
            <p style={p}>
              We protect data with HTTPS encryption in transit, server-side API
              checks, and IP rate limiting. Your core resume content lives on
              your local device and does not pass through our database.
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>6. Your rights</h2>
            <p style={p}>
              Because the product is not tied to any account, your resume data
              is entirely under your control:
            </p>
            <ul style={ul}>
              <li style={li}>
                You can delete all locally stored resumes at any time by
                clearing your browser data
              </li>
              <li style={li}>For any other requests, contact us by email</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>7. Contact</h2>
            <p style={p}>
              Questions about this policy? Email us at{" "}
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
