"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQ = [
  {
    cat: "基础使用",
    items: [
      {
        q: "简力全开是免费使用的吗？",
        a: "是的，基础功能完全免费：使用 5 套基础模板、在线编辑简历、PDF 下载（含水印）、模块拖拽排序、保存无限份简历，以及 2 次终身免费 AI 简历分析。如需去除水印、使用全部模板、或无限次使用 AI 分析等高级功能，需升级到 Pro 会员或单次购买。",
      },
      {
        q: "我需要注册账号吗？",
        a: "不需要。简力全开采用设备识别技术，您打开网页即可直接使用，所有数据存储在您的本地浏览器中。购买记录也绑定在您的设备上，无需账号即可恢复。",
      },
      {
        q: "我的简历数据会被上传到服务器吗？",
        a: "简历内容默认存储在您的本地浏览器（localStorage）中，不会主动上传。仅在您主动使用 AI 分析、PDF 下载等功能时，相关内容会被临时发送至服务器处理，处理完成后立即释放，不留存。",
      },
      {
        q: "如何保存简历？",
        a: '编辑器会自动保存您的最新草稿到浏览器本地。您也可以点击顶栏的"保存"按钮手动保存，保存后可在左侧"我的简历"历史列表中查看和切换。简历数据存储在浏览器本地，清除浏览器数据会导致记录丢失。',
      },
    ],
  },
  {
    cat: "模板与设计",
    items: [
      {
        q: "如何切换模板？",
        a: '在编辑器左侧面板的"模板"选项卡中，可以浏览并点击切换模板。切换模板不会丢失您的简历内容，只改变外观样式。带有锁图标的模板为 Pro 专属，升级后可解锁全部使用。',
      },
      {
        q: "如何修改模板颜色？",
        a: '在编辑器左侧面板的"颜色"选项卡中，可以从多个预设主题色中选择，或自定义颜色。颜色仅影响当前简历的主题色调。',
      },
      {
        q: "如何添加照片？",
        a: '在左侧"模块"选项卡中找到"照片"，点击后上传图片，支持裁剪和调整位置。部分模板默认无照片区域，可选择含照片布局的模板。',
      },
      {
        q: "简历有几页？页数超出怎么办？",
        a: '编辑器会自动将内容分页，底部工具栏会显示当前页数。建议将简历控制在 1-2 页内。如内容偏多，可适当精简各条描述，或在"模块"中隐藏不必要的模块。',
      },
    ],
  },
  {
    cat: "AI 功能",
    items: [
      {
        q: "AI 简历分析有哪些功能？",
        a: "AI 分析包含两个模式：①「简历润色」— 不填岗位信息时，AI 会逐条审视简历描述，找出表达薄弱或信息不足的地方，给出加强建议；②「岗位定向优化」— 填入目标 JD 后，AI 会分析简历与岗位的匹配度（Offer 率评分）、给出针对性改写建议，并生成 10 道面试题预测。所有改动均以高亮差异形式展示，您可以逐条选择应用或忽略。",
      },
      {
        q: "AI 分析在哪里使用？",
        a: "有两个入口：①首页「分析我的简历」板块，上传或粘贴简历内容即可直接分析，无需打开编辑器，免费用户终身可用 2 次；②编辑器顶栏的「AI 优化」按钮，分析结果可直接一键应用到当前简历，为 Pro 专属功能。",
      },
      {
        q: "可以用 AI 解析我的旧简历吗？",
        a: "可以。在编辑器顶栏点击「上传简历」，选择您的 PDF 或 Word 简历文件，AI 会自动提取内容并填充到编辑器中。解析后的简历与您手动填写的完全一样，可以继续编辑和美化。",
      },
      {
        q: "AI 分析每天有次数限制吗？",
        a: "Pro 订阅用户每天可使用 AI 分析 20 次；单次购买用户享有 2 次（终身）；免费用户终身可在首页免费使用 2 次。",
      },
    ],
  },
  {
    cat: "下载与导出",
    items: [
      {
        q: "如何下载 PDF？",
        a: '点击顶栏的"下载"按钮，即可下载简历 PDF。免费用户下载的 PDF 底部会有水印，升级 Pro 或单次购买后可去除水印。',
      },
      {
        q: "PDF 下载失败怎么办？",
        a: "PDF 由服务器端生成，通常需要 5-15 秒。如遇下载失败，可稍等片刻后重试。如持续失败，请检查网络连接或联系客服。",
      },
    ],
  },
  {
    cat: "付费与账单",
    items: [
      {
        q: "购买记录会丢失吗？",
        a: "购买记录存储在您的设备浏览器本地（localStorage + Cookie）。在同一设备同一浏览器中，记录会一直保留。清除浏览器数据、换设备或换浏览器可能导致记录丢失。建议购买后截图保存订单号，如需找回记录可联系客服。",
      },
      {
        q: "学生优惠如何申请？",
        a: '点击定价页或编辑器内的"学生认证"按钮，使用您的校园邮箱（.edu.cn 或 .edu 结尾）完成验证，即可享受全场 5 折优惠。认证有效期 1 年。',
      },
      {
        q: "支持退款吗？",
        a: "数字内容商品一经交付不支持退款。如因产品故障导致服务完全无法使用，可联系客服核实后处理。详见使用条款。",
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
            帮助中心
          </h1>
          <p
            style={{ color: "#64748b", marginBottom: "48px", fontSize: "15px" }}
          >
            常见问题解答，帮助你快速上手简力全开
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
              还有其他问题？
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "12px",
                lineHeight: 1.6,
              }}
            >
              如果在上面没有找到答案，欢迎通过邮件联系我们，我们通常在 1-2
              个工作日内回复。
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
              发送邮件
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
              ← 返回首页
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
