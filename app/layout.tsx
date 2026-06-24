import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumeRight — AI-powered professional resume builder",
  description:
    "Modular editing, smart AI optimization, one-click download. Build a resume that impresses.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
        {/* Google Translate rewrites text nodes in place, which makes React's later
            removeChild/insertBefore throw "NotFoundError: ... not a child of this node".
            Patch those two methods to skip safely when the node isn't where React expects.
            Runs before hydration so it's in place before any reconciliation. */}
        <Script id="translate-dom-guard" strategy="beforeInteractive">
          {`(function(){
            if (window.__rcTranslateGuard) return;
            window.__rcTranslateGuard = true;
            var rm = Node.prototype.removeChild;
            Node.prototype.removeChild = function(child){
              if (child && child.parentNode !== this) return child;
              return rm.apply(this, arguments);
            };
            var ins = Node.prototype.insertBefore;
            Node.prototype.insertBefore = function(newNode, refNode){
              if (refNode && refNode.parentNode !== this) return newNode;
              return ins.apply(this, arguments);
            };
          })();`}
        </Script>
      </head>
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C7DTTEXRWS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-C7DTTEXRWS');
          `}
        </Script>
      </body>
    </html>
  );
}
