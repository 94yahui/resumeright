import Link from 'next/link'
import Navbar from '../components/Navbar'

export const metadata = { title: '使用条款 — 简力全开' }

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-1px' }}>使用条款</h1>
          <p style={{ color: '#64748b', marginBottom: '48px', fontSize: '14px' }}>最后更新：2026年1月1日</p>

          <p style={p}>欢迎使用简力全开（jianliquankai.com）。在使用本产品前，请仔细阅读以下使用条款。使用本产品即表示您同意接受这些条款的约束。</p>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={h2}>1. 服务说明</h2>
            <p style={p}>简力全开提供在线简历制作、AI 内容优化、岗位匹配分析等工具服务。我们提供免费版和付费版两种服务方案，具体功能差异见产品定价页面。</p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={h2}>2. 账号与身份</h2>
            <p style={p}>本产品不要求用户注册账号。我们通过浏览器设备标识（Device ID）区分用户身份，购买记录绑定于该设备标识。如您更换设备或清除浏览器数据，购买记录可能无法恢复，请妥善保管您的设备信息。</p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={h2}>3. 付费与退款</h2>
            <h3 style={h3}>3.1 付费方式</h3>
            <p style={p}>本产品提供月卡、季卡、年卡订阅，以及单次模板购买。付款后立即生效，无需审核。</p>
            <h3 style={h3}>3.2 退款政策</h3>
            <p style={p}>数字内容商品的特殊性决定其一旦交付即无法撤回。因此，在以下情况下我们不支持退款：</p>
            <ul style={ul}>
              <li style={li}>已正常使用过 AI 功能或下载过无水印 PDF</li>
              <li style={li}>已过购买后 24 小时</li>
            </ul>
            <p style={p}>若因本产品技术故障导致服务完全无法使用，请联系客服，我们将在核实后酌情退款或延长服务期。</p>
            <h3 style={h3}>3.3 学生优惠</h3>
            <p style={p}>学生认证通过后享全场 5 折，认证有效期 1 年。学生认证仅适用于持有有效校园邮箱的在校学生，我们保留核实资质的权利。</p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={h2}>4. 内容规范</h2>
            <p style={p}>您同意在使用本产品时不得：</p>
            <ul style={ul}>
              <li style={li}>上传、处理任何违法、侵权、涉密的内容</li>
              <li style={li}>通过技术手段绕过使用限制或付费验证</li>
              <li style={li}>将 AI 输出内容用于学术欺诈、虚假陈述等不诚信行为</li>
              <li style={li}>对本产品进行逆向工程、爬取或自动化滥用</li>
            </ul>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={h2}>5. 知识产权</h2>
            <p style={p}>本产品的模板设计、代码、Logo 及品牌标识均为简力全开所有，未经书面许可不得复制或商业使用。</p>
            <p style={p}>您使用本产品生成的简历内容（包括 AI 优化后的文字）归您本人所有，我们不对其主张任何权利。</p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={h2}>6. 服务变更与中断</h2>
            <p style={p}>我们保留随时修改、暂停或终止部分或全部服务的权利。如遇重大变更，我们将提前通知用户。因不可抗力（服务器故障、第三方 API 中断等）导致的服务中断，我们不承担赔偿责任，但会尽快恢复。</p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={h2}>7. 免责声明</h2>
            <p style={p}>AI 优化建议仅供参考，不代表专业人力资源顾问意见。简历最终质量由您自行判断和把控。我们不对因使用本产品生成的简历导致的求职结果承担责任。</p>
          </section>

          <section>
            <h2 style={h2}>8. 条款修改</h2>
            <p style={p}>我们保留随时修改本使用条款的权利。修改后继续使用本产品，即视为您接受新的条款。如有疑问，请联系：<a href="mailto:hello@jianliquankai.com" style={{ color: '#0789ec', textDecoration: 'none' }}>hello@jianliquankai.com</a></p>
          </section>

          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
            <Link href="/" style={{ color: '#0789ec', textDecoration: 'none', fontSize: '14px' }}>← 返回首页</Link>
          </div>
        </div>
      </main>
    </>
  )
}

const h2: React.CSSProperties = { fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', marginTop: '4px' }
const h3: React.CSSProperties = { fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '8px', marginTop: '16px' }
const p: React.CSSProperties = { color: '#334155', lineHeight: 1.8, marginBottom: '14px', fontSize: '15px' }
const ul: React.CSSProperties = { paddingLeft: '20px', margin: '0 0 14px' }
const li: React.CSSProperties = { color: '#334155', lineHeight: 1.8, marginBottom: '6px', fontSize: '15px' }
