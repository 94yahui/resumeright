import Link from "next/link";
import Navbar from "../components/Navbar";

export const metadata = { title: "隐私政策 — 简力全开" };

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
            隐私政策
          </h1>
          <p
            style={{ color: "#64748b", marginBottom: "48px", fontSize: "14px" }}
          >
            最后更新：2026年1月1日
          </p>

          <p style={p}>
            简力全开（以下简称"本产品"或"我们"）高度重视用户的隐私权。本隐私政策说明我们如何收集、使用和保护您的信息。
          </p>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>1. 我们收集哪些信息</h2>
            <h3 style={h3}>设备标识（Device ID）</h3>
            <p style={p}>
              本产品采用设备唯一标识（UUID）替代用户账号体系。该标识通过浏览器
              Cookie 和 localStorage 双写存储，有效期 1
              年，仅用于区分不同设备、记录购买记录和使用量配额，不包含任何可识别个人身份的信息。
            </p>
            <h3 style={h3}>简历内容</h3>
            <p style={p}>
              您在编辑器中填写的简历内容默认仅存储在您的本地浏览器（localStorage）中，不会主动上传至我们的服务器。当您使用以下功能时，相关内容会被临时发送至服务器处理：
            </p>
            <ul style={ul}>
              <li style={li}>
                <strong>AI 内容优化</strong>
                ：您的工作/项目描述或个人简介将发送至阿里云通义千问 API 进行处理
              </li>
              <li style={li}>
                <strong>岗位匹配分析</strong>
                ：您的简历结构化数据和岗位描述将发送至阿里云通义千问 API
                进行分析
              </li>
              <li style={li}>
                <strong>简历解析</strong>：您上传的 PDF/Word
                文件将发送至服务器进行文字提取，再转发至 AI 模型
              </li>
              <li style={li}>
                <strong>PDF 下载</strong>：简历 HTML 内容将发送至服务器以生成
                PDF 文件
              </li>
            </ul>
            <p style={p}>
              上述内容均为一次性处理，处理完成后服务器不会留存您的简历数据。
            </p>
            <h3 style={h3}>支付信息</h3>
            <p style={p}>
              支付成功后，我们仅记录订单 ID、设备
              ID、套餐类型、购买时间等基本订单信息，不收集、存储任何银行卡号、支付宝账号等金融敏感信息。
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>2. 我们如何使用信息</h2>
            <p style={p}>收集的信息仅用于以下目的：</p>
            <ul style={ul}>
              <li style={li}>提供 AI 功能服务（优化、分析、解析）</li>
              <li style={li}>验证购买状态和使用配额</li>
              <li style={li}>改善产品功能和用户体验</li>
              <li style={li}>防止滥用行为（如 API 限速）</li>
            </ul>
            <p style={p}>
              我们不会将您的信息出售给任何第三方，也不会用于广告投放或用户画像建立。
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>3. Cookie 与本地存储</h2>
            <p style={p}>
              我们使用 Cookie 和 localStorage
              存储设备标识及购买记录，以确保您在同一设备上的购买记录和编辑历史可以持久保留。清除浏览器数据可能导致这些记录丢失。
            </p>
            <p style={p}>我们不使用第三方追踪 Cookie，不集成任何广告 SDK。</p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>4. 第三方服务</h2>
            <p style={p}>本产品使用以下第三方服务：</p>
            <ul style={ul}>
              <li style={li}>
                <strong>阿里云通义千问（Qwen）</strong>：AI
                功能的底层模型，受阿里云隐私政策约束
              </li>
              <li style={li}>
                <strong>Google Fonts</strong>：字体加载服务，您的 IP 地址可能被
                Google 记录
              </li>
              <li style={li}>
                <strong>Vercel</strong>：网站托管平台，可能记录基本的访问日志
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>5. 数据安全</h2>
            <p style={p}>
              我们通过 HTTPS 加密传输、服务端 API 鉴权、IP
              限速等手段保护数据安全。简历核心内容存储在您的本地设备，不经过我们的数据库。
            </p>
          </section>

          <section style={{ marginBottom: "36px" }}>
            <h2 style={h2}>6. 您的权利</h2>
            <p style={p}>
              由于本产品不关联任何账号，您的简历数据完全由您本人控制：
            </p>
            <ul style={ul}>
              <li style={li}>
                您可随时通过清除浏览器数据来删除所有本地存储的简历和购买记录
              </li>
              <li style={li}>如需删除订单记录，请联系我们的客服邮箱</li>
            </ul>
          </section>

          <section>
            <h2 style={h2}>7. 联系我们</h2>
            <p style={p}>
              如对本隐私政策有任何疑问，请发邮件至：
              <a
                href="mailto:privacy@jianliquankai.com"
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
