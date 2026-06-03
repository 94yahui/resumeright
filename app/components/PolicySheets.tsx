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
export const uls: React.CSSProperties = { paddingLeft: "18px", margin: "0 0 12px" };
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

export function TermsContent() {
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
