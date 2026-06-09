import Link from "next/link";
import Navbar from "../components/Navbar";

export const metadata = { title: "关于我们 — 简力全开" };

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
            关于我们
          </h1>
          <p
            style={{ color: "#64748b", marginBottom: "48px", fontSize: "15px" }}
          >
            简力全开 · jianliquankai.com
          </p>

          <section style={{ marginBottom: "40px" }}>
            <h2 style={h2}>我们是谁</h2>
            <p style={p}>
              简力全开是一款 AI
              驱动的在线简历制作工具，专为中国求职者打造。我们相信，每一个人都应该有机会用最专业的方式展示自己，而不被繁琐的排版软件所困扰。
            </p>
            <p style={p}>
              我们的团队由热爱 AI
              与设计的工程师和产品人组成，致力于把简历写作这件"难而重要"的事情，变成一件轻松、高效、有成就感的事。
            </p>
          </section>

          <section style={{ marginBottom: "40px" }}>
            <h2 style={h2}>我们的产品</h2>
            <p style={p}>简力全开提供：</p>
            <ul style={ul}>
              <li style={li}>
                专业简历模板，覆盖互联网、金融、设计、学术等主流行业
              </li>
              <li style={li}>
                AI 内容优化：一键重写工作/项目描述，让描述更量化、更有说服力
              </li>
              <li style={li}>
                岗位匹配分析：上传目标职位详情，AI
                分析匹配度并给出针对性修改建议
              </li>
              <li style={li}>
                简历智能解析：上传已有 PDF/Word 简历，自动提取内容进入编辑器
              </li>
              <li style={li}>
                无账号体验：基于设备识别，无需注册即可使用，数据本地存储保护隐私
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: "40px" }}>
            <h2 style={h2}>我们的理念</h2>
            <p style={p}>
              我们不收集用户的个人账号信息，不依赖社交登录，不向第三方出售数据。简历是求职者最私密的文档之一——我们把数据所有权还给用户本人。
            </p>
            <p style={p}>
              同时，我们相信好的工具应该价格公道、功能透明。我们的定价从永久免费到低价订阅，让不同需求的用户都能找到适合自己的方案。
            </p>
          </section>

          <section>
            <h2 style={h2}>联系我们</h2>
            <p style={p}>
              如有任何问题、建议或合作意向，欢迎通过以下方式联系：
            </p>
            <p style={{ ...p, marginBottom: 0 }}>
              邮箱：
              <a
                href="mailto:839081822@qq.com"
                style={{ color: "#0789ec", textDecoration: "none" }}
              >
                hello@jianliquankai.com
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
              返回首页
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
