"use client";
import { useRef, useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";

type Sheet = "about" | "privacy" | "terms" | "help" | null;

// ─── Shared prose styles ─────────────────────────────────────────────────────
const h2s: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#0f172a",
  margin: "28px 0 10px",
};
const h3s: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#334155",
  margin: "16px 0 6px",
};
const ps: React.CSSProperties = {
  color: "#334155",
  lineHeight: 1.8,
  marginBottom: "12px",
  fontSize: "14px",
};
const uls: React.CSSProperties = { paddingLeft: "18px", margin: "0 0 12px" };
const lis: React.CSSProperties = {
  color: "#334155",
  lineHeight: 1.8,
  marginBottom: "4px",
  fontSize: "14px",
};

// ─── Sheet contents ───────────────────────────────────────────────────────────
function AboutContent() {
  return (
    <div>
      <p style={ps}>
        简力全开是一款 AI
        驱动的在线简历制作工具，专为中国求职者打造。我们相信每一个人都应该有机会用最专业的方式展示自己，而不被繁琐的排版软件所困扰。
      </p>
      <h2 style={h2s}>我们的产品</h2>
      <ul style={uls}>
        <li style={lis}>
          30 套专业简历模板，覆盖互联网、金融、设计、学术等主流行业
        </li>
        <li style={lis}>
          AI 简历分析：简历润色 + 岗位匹配度评分 + 面试题预测，覆盖两种使用场景
        </li>
        <li style={lis}>
          一键生成英文简历：智能翻译全部简历内容，保留原始格式与数据
        </li>
        <li style={lis}>
          简历智能导入：上传已有 PDF/Word 简历，自动提取内容进入编辑器
        </li>
        <li style={lis}>
          微信扫码登录：无需填写账号密码，登录后简历、会员权益跨设备同步
        </li>
      </ul>
      <h2 style={h2s}>我们的理念</h2>
      <p style={ps}>
        我们不向第三方出售任何用户数据。简历是求职者最私密的文档之一——我们仅在提供服务所必需的范围内处理数据，并将数据所有权还给用户本人。
      </p>
      <h2 style={h2s}>联系我们</h2>
      <p style={{ ...ps, marginBottom: 0 }}>
        邮箱：
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

function PrivacyContent() {
  return (
    <div>
      <p style={ps}>
        简力全开高度重视用户的隐私权。本政策说明我们如何收集、使用和保护您的信息。
      </p>
      <h2 style={h2s}>1. 我们收集哪些信息</h2>
      <h3 style={h3s}>设备标识（Device ID）</h3>
      <p style={ps}>
        通过浏览器 Cookie 和 localStorage 存储的设备唯一 UUID，有效期 1
        年，仅用于区分设备、记录使用量配额，不含任何可识别个人身份的信息。
      </p>
      <h3 style={h3s}>账号信息（可选）</h3>
      <p style={ps}>
        使用微信扫码登录后，我们会获取并存储您的微信 OpenID、昵称和头像，用于识别账号身份及跨设备同步数据。未登录用户不涉及此项。
      </p>
      <h3 style={h3s}>简历内容</h3>
      <p style={ps}>
        未登录时仅存储在您的本地浏览器。登录后，简历内容会加密同步至我们的服务器，以实现跨设备访问。以下功能使用时会将简历内容临时发送至 AI 服务处理，处理完成后立即释放，不留存：
      </p>
      <ul style={uls}>
        <li style={lis}>
          AI 简历分析、英文简历生成（发送至 DeepSeek API）
        </li>
        <li style={lis}>简历智能导入（PDF/Word 文字提取后转发 AI 模型）</li>
        <li style={lis}>PDF 下载（HTML 内容发送至服务器生成 PDF）</li>
      </ul>
      <h3 style={h3s}>支付信息</h3>
      <p style={ps}>
        仅记录订单 ID、账号/设备标识、套餐类型、购买时间等，不收集银行卡号等金融敏感信息。支付由虎皮椒（微信支付）处理，我们不接触您的支付凭证。
      </p>
      <h2 style={h2s}>2. Cookie 与本地存储</h2>
      <p style={ps}>
        我们使用 Cookie 存储登录状态和设备标识，使用 localStorage 存储简历草稿和本地偏好。不使用第三方追踪 Cookie，不集成任何广告 SDK。
      </p>
      <h2 style={h2s}>3. 第三方服务</h2>
      <ul style={uls}>
        <li style={lis}>
          <strong>DeepSeek</strong>：AI 功能底层模型，受 DeepSeek 隐私政策约束
        </li>
        <li style={lis}>
          <strong>微信开放平台</strong>：提供扫码登录能力，受腾讯隐私政策约束
        </li>
        <li style={lis}>
          <strong>Vercel</strong>：网站托管，可能记录基本访问日志
        </li>
      </ul>
      <h2 style={h2s}>4. 联系我们</h2>
      <p style={{ ...ps, marginBottom: 0 }}>
        如有疑问：
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

function TermsContent() {
  return (
    <div>
      <p style={{ ...ps, color: "#64748b", fontSize: "13px" }}>
        最后更新：2026年6月1日
      </p>
      <p style={ps}>使用简力全开即表示您同意接受以下条款的约束。</p>
      <h2 style={h2s}>1. 服务说明</h2>
      <p style={ps}>
        简力全开提供在线简历制作、AI
        简历分析、英文简历生成等工具服务，分免费版和付费版两种方案。
      </p>
      <h2 style={h2s}>2. 账号与身份</h2>
      <p style={ps}>
        本产品不要求注册账号，打开即用。您也可以选择微信扫码登录，登录后简历、会员权益、AI 次数将绑定至微信账号，换设备登录同一微信账号即可恢复全部数据。未登录用户的购买记录绑定于设备，更换设备或清除浏览器数据可能导致记录丢失，请妥善保管订单号。
      </p>
      <h2 style={h2s}>3. 付费与退款</h2>
      <p style={ps}>
        提供月卡、季卡、年卡订阅及单次模板购买，付款后立即生效。数字内容商品一经交付原则上不支持退款。已正常使用
        AI 功能或已下载无水印 PDF 者，或购买超过 24
        小时者，不予退款。因产品技术故障导致服务完全无法使用，可联系客服核实后处理。
      </p>
      <p style={ps}>学生认证通过后享全场 5 折，认证有效期 1 年。</p>
      <h2 style={h2s}>4. 内容规范</h2>
      <ul style={uls}>
        <li style={lis}>不得上传处理违法、侵权、涉密内容</li>
        <li style={lis}>不得通过技术手段绕过使用限制或付费验证</li>
        <li style={lis}>不得将 AI 输出用于学术欺诈、虚假陈述等不诚信行为</li>
      </ul>
      <h2 style={h2s}>5. 知识产权</h2>
      <p style={ps}>
        模板设计、代码、Logo
        均为简力全开所有。您使用本产品生成的简历内容归您本人所有。
      </p>
      <h2 style={h2s}>6. 演示内容声明</h2>
      <p style={ps}>
        本产品页面（首页、模板预览等）所展示的示例简历中，"陈梦瑶"等人名均为虚构演示人物，不代表任何真实存在的自然人，亦不构成对任何个人姓名权或肖像权的侵犯。示例照片为
        AI
        生成的虚拟形象，不对应任何真实人物。如有相关方认为存在侵权，请联系我们，我们将在核实后第一时间处理。
      </p>
      <h2 style={h2s}>7. 免责声明</h2>
      <p style={ps}>
        AI 分析建议仅供参考，不代表专业 HR
        意见。我们不对因使用本产品生成的简历导致的求职结果承担责任。
      </p>
      <h2 style={h2s}>8. 联系</h2>
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

const FAQ_SECTIONS = [
  {
    cat: "基础使用",
    items: [
      {
        q: "简力全开是免费使用的吗？",
        a: "是的，基础功能完全免费：5 套基础模板、在线编辑、PDF 下载（含水印）、模块拖拽排序、保存无限份简历，以及 2 次终身免费 AI 简历分析。去除水印、全部模板、AI 优化等高级功能需升级 Pro 或单次购买。",
      },
      {
        q: "我需要注册账号吗？",
        a: "不需要。打开网页即可直接使用，所有数据默认存储在您的本地浏览器中。您也可以选择微信扫码登录（可选），登录后简历内容、会员权益和 AI 使用次数将同步至云端，换设备后用同一微信账号登录即可恢复所有数据。",
      },
      {
        q: "我的简历数据会被上传到服务器吗？",
        a: "未登录时，简历内容仅存储在本地浏览器中，不会主动上传。微信扫码登录后，简历内容会同步至我们的服务器以实现跨设备访问。使用 AI 分析、PDF 下载等功能时，相关内容会被临时发送至服务器处理，处理完成后立即释放，不永久留存。",
      },
      {
        q: "如何保存简历？",
        a: '编辑器会自动保存草稿到本地。也可点击顶栏"保存"按钮手动保存，保存后可在左侧"我的简历"历史列表查看和切换。',
      },
    ],
  },
  {
    cat: "AI 功能",
    items: [
      {
        q: "AI 简历分析有哪些功能？",
        a: "AI 分析包含两个模式：1.简历润色 — 不填岗位信息时，AI 逐条审视描述，找出表达薄弱的地方给出加强建议；2.岗位定向优化 — 填入目标职位信息后，AI 分析匹配度（面试机会预测）、给出改写建议并生成 10 道面试题。所有改动以高亮差异展示，可逐条选择应用。",
      },
      {
        q: "AI 分析在哪里使用？",
        a: "有两个入口：1.首页「分析我的简历」板块，免费用户终身可用 2 次；2.编辑器顶栏「AI 优化」按钮，分析结果可一键应用到当前简历，为 Pro 专属功能。",
      },
      {
        q: "AI 功能每天有次数限制吗？",
        a: "Pro 订阅用户每天可使用 AI 分析 20 次、生成英文简历 5 次；单次购买用户享有 AI 分析 5 次（终身）；免费用户可在首页免费使用 AI 分析 2 次（终身）。",
      },
    ],
  },
  {
    cat: "下载与导出",
    items: [
      {
        q: "如何下载 PDF？",
        a: '点击顶栏"下载"按钮，即可下载简历 PDF。免费用户下载的 PDF 底部有水印，升级后可去除。',
      },
      {
        q: "PDF 下载失败怎么办？",
        a: "PDF 由服务器端生成，通常需要 5-15 秒。如遇失败，稍等后重试，或检查网络连接，持续失败请联系客服。",
      },
    ],
  },
  {
    cat: "付费与账单",
    items: [
      {
        q: "购买记录会丢失吗？",
        a: "微信扫码登录后购买的会员权益绑定至微信账号，换设备登录同一账号即可自动恢复。未登录情况下购买的记录绑定在设备本地，清除浏览器数据或换设备可能导致丢失，建议保存订单号以便联系客服找回。",
      },
      {
        q: "学生优惠如何申请？",
        a: '点击定价页或编辑器内的"学生认证"按钮，勾选学生身份声明（诚信承诺制，无需上传证件），即可享全场 5 折，有效期 1 年。',
      },
      {
        q: "支持退款吗？",
        a: "数字内容商品一经交付不支持退款。如因产品故障导致服务完全无法使用，可联系客服核实后处理。",
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
          还有其他问题？
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
          如在上面没有找到答案，欢迎通过邮件联系，通常在 1-2 个工作日内回复。
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
          发送邮件
        </a>
      </div>
    </div>
  );
}

// ─── Bottom sheet ─────────────────────────────────────────────────────────────
const SHEET_TITLES: Record<Exclude<Sheet, null>, string> = {
  about: "关于我们",
  privacy: "隐私政策",
  terms: "使用条款",
  help: "帮助中心",
};

function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
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
          zIndex: 200,
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: open ? "auto" : "none",
        }}
      />
      {/* Outer: horizontal positioning only — CSS overrides this to full-width on mobile */}
      <div
        className="bottom-sheet-panel"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 0,
          zIndex: 201,
          width: "min(720px, calc(100vw - 48px))",
          transform: "translateX(-50%)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Inner: vertical slide animation — unaffected by mobile CSS overrides */}
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
          {/* Handle bar — drag to close */}
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
          {/* Header */}
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
          {/* Content */}
          <div style={{ overflowY: "auto", padding: "20px", flex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
const LINKS: { label: string; id: Exclude<Sheet, null> }[] = [
  { label: "关于我们", id: "about" },
  { label: "隐私政策", id: "privacy" },
  { label: "使用条款", id: "terms" },
  { label: "帮助中心", id: "help" },
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
          <div
            style={{ fontSize: "20px", color: "var(--paper)", fontWeight: 500 }}
          >
            简力全开
          </div>
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
            © 2026 简力全开
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
