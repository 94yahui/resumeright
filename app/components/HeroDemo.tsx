"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import TemplateThumbnail from "../lib/TemplateThumbnail";
import RainbowRing from "./RainbowRing";
import { getTemplate, AccentStyle } from "../lib/templates-config";
import { sampleResumeData } from "../lib/types";

// Hero preview content: single-column sample, 3 bullets per project entry, no Languages.
const heroSample = (() => {
  const d = sampleResumeData({ single: true });
  return {
    ...d,
    hasLanguage: false,
    project: d.project.map((p) => ({ ...p, bullets: p.bullets.slice(0, 3) })),
  };
})();

// ── Scripted demo loop ────────────────────────────────────────────────────────
// A ghost cursor walks through the core editing flow, on repeat:
//   1 point a module → a field-edit panel slides in (glowing)   ← edits one block
//   2 point the color bar → pick a swatch → the WHOLE resume recolors
//   3 point the heading-style picker → pick → ALL section titles restyle
// Only the active panel glows at a time, so the eye is always led to one place.
// The cursor lands on the REAL target element (measured from the DOM), not a guess.
type Phase = 0 | 1 | 2 | 3 | 4 | 5;
// phase 1 is long enough to play the AI "Job matched" score animation; the color/heading
// picks are short so the cursor doesn't linger on the swatch/chip after selecting.
const PHASE_DUR = [900, 2700, 800, 850, 800, 850]; // ms per phase
// Delay from phase-start to the "click": phase 1 needs the cursor to travel in from rest,
// but for color/heading the cursor already arrived during the approach phase, so confirm fast.
const CLICK_DELAY: Partial<Record<Phase, number>> = { 1: 680, 3: 220, 5: 220 };
const AI_REVEAL_DELAY = 300; // small pause between the AI click and the ring appearing
const AI_SCORE_FROM = 7.2;
const AI_SCORE_TO = 9.5;

// Presets rotated one-per-loop so the resume keeps visibly changing.
const DEMO_COLORS = ["#0d9488", "#1e3a8a", "#9f1239"]; // teal · navy · burgundy
const DEMO_STYLES: AccentStyle[] = ["left-bar", "background-pill", "underline-bar"];

// Color bar swatches (the three demo colors are a subset, so the "selected" ring lands on one).
const SWATCHES = ["#0f172a", "#1e3a8a", "#0d9488", "#9f1239", "#6d28d9", "#b45309"];
// Heading-style chips offered in the mock picker.
const CHIPS: { v: AccentStyle; l: string }[] = [
  { v: "left-bar", l: "Left bar" },
  { v: "background-pill", l: "Pill" },
  { v: "underline-bar", l: "Underline" },
  { v: "thin-line", l: "Thin line" },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

// Center of `el` in `card`'s local coordinates — summed over the offsetParent chain so
// it's immune to the panels' entrance transforms (offsetLeft/Top ignore CSS transforms).
function centerInCard(el: HTMLElement, card: HTMLElement) {
  let x = 0, y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== card) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
}

export default function HeroDemo() {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>(0);
  const [paused, setPaused] = useState(false);
  const [color, setColor] = useState(SWATCHES[0]);
  const [style, setStyle] = useState<AccentStyle>("underline-bar");
  const [clickKey, setClickKey] = useState(0); // re-triggers the click ripple
  const [armedKey, setArmedKey] = useState(""); // which (loop,phase) the cursor has landed on
  const [pressing, setPressing] = useState(false); // brief pointer "press" at the click
  const [loop, setLoop] = useState(0);         // completed loops — rotates the presets
  const [aiScore, setAiScore] = useState(AI_SCORE_FROM); // animated match score in the AI panel
  const [aiRevealKey, setAiRevealKey] = useState(""); // ring shown only after a brief post-click pause

  // What THIS loop will select once the cursor lands (decided up-front so the cursor can
  // travel to the right swatch/chip before anything actually changes).
  const pendingColor = DEMO_COLORS[loop % DEMO_COLORS.length];
  const pendingStyle = DEMO_STYLES[loop % DEMO_STYLES.length];

  // Cursor position is measured (px, in card-local coords) so it hits the real target.
  const cardRef = useRef<HTMLDivElement>(null);
  const aiBtnRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  // Advance the script. Each phase just schedules the next (no commit here).
  useEffect(() => {
    if (reduced || paused) return;
    const timer = setTimeout(() => {
      setPhase((p) => {
        const next = ((p + 1) % 6) as Phase;
        if (next === 0) setLoop((l) => l + 1);
        return next;
      });
    }, PHASE_DUR[phase]);
    return () => clearTimeout(timer);
  }, [phase, reduced, paused]);

  // `armed` flips true only AFTER the cursor reaches its target and pauses — derived from a
  // per-occurrence key so it auto-resets when the phase advances (no synchronous reset needed).
  const thisKey = `${loop}-${phase}`;
  const armed = armedKey === thisKey;

  // Register the "click" once the cursor has reached its target — and commit the color/heading
  // change there, so it never fires before the cursor lands.
  const clickDelay = CLICK_DELAY[phase];
  useEffect(() => {
    if (reduced || paused || clickDelay === undefined) return;
    const t = setTimeout(() => {
      setArmedKey(`${loop}-${phase}`);
      setClickKey((k) => k + 1); // ripple at the actual click moment
      setPressing(true);
      if (phase === 1) setAiScore(AI_SCORE_FROM); // start the count-up from a low score
      if (phase === 3) setColor(pendingColor);
      if (phase === 5) setStyle(pendingStyle);
      setTimeout(() => setPressing(false), 200);
    }, clickDelay);
    return () => clearTimeout(t);
  }, [phase, loop, reduced, paused, clickDelay, pendingColor, pendingStyle]);

  // After the AI click, wait a beat before revealing the result ring.
  const aiClicked = phase === 1 && armed;
  useEffect(() => {
    if (!aiClicked) return;
    const t = setTimeout(() => setAiRevealKey(`${loop}-1`), AI_REVEAL_DELAY);
    return () => clearTimeout(t);
  }, [aiClicked, loop]);

  // Count the AI match score up (7.2 → 9.5) once the ring is revealed.
  const aiActive = phase === 1 && aiRevealKey === `${loop}-1`;
  useEffect(() => {
    if (!aiActive) return;
    const dur = 1300, start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out
      setAiScore(+(AI_SCORE_FROM + (AI_SCORE_TO - AI_SCORE_FROM) * eased).toFixed(1));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [aiActive]);

  // Position the ghost cursor on the current phase's real target (and re-measure on resize).
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const measure = () => {
      // Approach + pick phases share the SAME target, so the cursor glides straight to the
      // swatch/chip in one motion instead of stopping near it and re-adjusting.
      const target =
        phase === 1 ? aiBtnRef.current :
        (phase === 2 || phase === 3) ? swatchRef.current :
        (phase === 4 || phase === 5) ? chipRef.current : null;
      // phase 0 rests low-center; otherwise hold position if the target ref is momentarily
      // absent (e.g. the AI button is swapped for the result ring) instead of jumping away.
      if (target) setCursor(centerInCard(target, card));
      else if (phase === 0) setCursor({ x: card.offsetWidth * 0.5, y: card.offsetHeight * 0.9 });
      setReady(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(card);
    return () => ro.disconnect();
  }, [phase, color, style]);

  const live = !reduced; // overlay only animates when motion is allowed
  const showEdit = live && phase === 1;
  const showColors = live && (phase === 2 || phase === 3);
  const showHeading = live && (phase === 4 || phase === 5);

  return (
    <div
      ref={cardRef}
      className="hero-right fade-in"
      style={{ position: "relative", transitionDelay: "0.2s" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Stacked background cards */}
      <div style={{
        position: "absolute", top: "16px", left: "16px", right: "-16px", bottom: "-16px",
        background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.5)",
        boxShadow: "0 6px 24px rgba(26,24,20,0.08)",
        animation: "heroTilt5 0.9s cubic-bezier(0.34,1.56,0.64,1) .8s both", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", top: "8px", left: "8px", right: "-8px", bottom: "-8px",
        background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.6)",
        boxShadow: "0 6px 20px rgba(26,24,20,0.08)",
        animation: "heroTilt2 0.7s cubic-bezier(0.34,1.56,0.64,1) .9s both", zIndex: 1,
      }} />

      {/* Resume card — driven by the demo's current color + heading style */}
      <div style={{
        background: "rgba(255, 255, 255, 0.2)", backdropFilter: "blur(5px)",
        boxShadow: "0 16px 50px rgba(26,24,20,0.18), 0 4px 12px rgba(26,24,20,0.08)",
        overflow: "hidden", border: "1px solid var(--paper3)", position: "relative", zIndex: 2,
      }}>
        <div style={{ position: "relative", maxHeight: "680px", overflow: "hidden", background: "#ffffff" }}>
          <TemplateThumbnail
            template={getTemplate("classic-pro")}
            fillWidth
            data={heroSample}
            color={color}
            accentStyle={style}
          />
          {/* Soften the bottom clip so the page looks like it continues */}
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: "90px",
            background: "linear-gradient(rgba(255,255,255,0), #ffffff)", pointerEvents: "none",
          }} />
        </div>
      </div>

      {/* ── Overlay: ghost cursor + mock editor panels (decorative) ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 6, pointerEvents: "none", overflow: "visible" }}>
        {/* Field-edit panel (phase 1): the form morphs into the AI "Job matched" result on click */}
        <Panel show={showEdit} style={{ top: "24%", right: "-9%", width: "150px" }}>
          {aiActive ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "2px 0" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "5px",
                fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#16a34a",
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#16a34a" }} />
                Job matched
              </div>
              <span translate="no" className="notranslate" style={{ display: "inline-flex" }}>
                <RainbowRing score={aiScore} size={74} />
              </span>
            </div>
          ) : (
            <>
              <PanelLabel>Edit experience</PanelLabel>
              <FieldRow w="100%" />
              <FieldRow w="72%" />
              <div ref={aiBtnRef} style={{
                marginTop: "8px", fontSize: "9px", fontWeight: 600, color: "#fff", textAlign: "center",
                padding: "5px 0", borderRadius: "5px",
                background: "linear-gradient(135deg, var(--ai-color-1), var(--theme-blue))",
              }}>✦ AI optimize</div>
            </>
          )}
        </Panel>

        {/* Color bar (phases 2–3) */}
        <Panel show={showColors} style={{ top: "7%", right: "-7%", width: "172px" }}>
          <PanelLabel>Accent color</PanelLabel>
          <div style={{ display: "flex", gap: "7px", marginTop: "2px" }}>
            {SWATCHES.map((c) => {
              const target = c === pendingColor;        // where the cursor heads
              const on = phase === 3 && armed && target; // ring only after it lands
              return (
                <div key={c} ref={target ? swatchRef : undefined} style={{
                  width: "17px", height: "17px", borderRadius: "50%", background: c,
                  boxShadow: on ? "0 0 0 2px #fff, 0 0 0 4px " + c : "0 0 0 1px rgba(0,0,0,0.08)",
                  transform: on ? "scale(1.12)" : "scale(1)", transition: "all 0.25s ease",
                }} />
              );
            })}
          </div>
        </Panel>

        {/* Heading-style picker (phases 4–5) */}
        <Panel show={showHeading} style={{ top: "33%", right: "-8%", width: "150px" }}>
          <PanelLabel>Heading style</PanelLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "2px" }}>
            {CHIPS.map((c) => {
              const target = c.v === pendingStyle;       // where the cursor heads
              const on = phase === 5 && armed && target;  // highlight only after it lands
              return (
                <div key={c.v} ref={target ? chipRef : undefined} style={{
                  fontSize: "10px", fontWeight: on ? 600 : 500,
                  color: on ? "var(--theme-blue)" : "#475569",
                  padding: "5px 8px", borderRadius: "5px",
                  background: on ? "rgba(59,130,246,0.14)" : "rgba(15,23,42,0.05)",
                  boxShadow: on ? "0 0 0 1px rgba(59,130,246,0.5)" : "none",
                  transition: "all 0.25s ease",
                }}>{c.l}</div>
              );
            })}
          </div>
        </Panel>

        {/* Ghost cursor */}
        {live && (
          <div style={{
            position: "absolute", left: 0, top: 0,
            // Offset by the pointer-tip position (~5,3 in the 20×20 svg) so the tip — not
            // the box corner — lands on the measured target center.
            transform: `translate(${cursor.x - 5}px, ${cursor.y - 3}px)`,
            opacity: ready ? 1 : 0,
            transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
            filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))", willChange: "transform",
          }}>
            {/* Press dip + click ripple, centered on the pointer tip — only at the moment
                the cursor lands (armed), not during the whole phase */}
            <div style={{
              transform: `scale(${pressing ? 0.82 : 1})`, transition: "transform 0.18s ease",
              transformOrigin: "4px 3px",
            }}>
              {armed && (
                <span key={clickKey} style={{
                  position: "absolute", left: "5px", top: "4px", width: "26px", height: "26px",
                  marginLeft: "-13px", marginTop: "-13px", borderRadius: "50%",
                  background: "rgba(59,130,246,0.4)",
                  animation: "demoRipple 0.7s ease-out", pointerEvents: "none",
                }} />
              )}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 3l14 7-6 1.6L9.5 18 5 3z" fill="#fff" stroke="#0f172a" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// A floating editor panel: translucent so it never fully hides the resume; fades/slides
// in when active, with a static cyan edge glow while shown.
function Panel({ show, style, children }: {
  show: boolean;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute", borderRadius: "9px", padding: "10px",
        background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)",
        boxShadow: show ? "0 6px 20px rgba(15,23,42,0.14), 0 0 18px 3px rgba(6,182,212,0.45)" : "none",
        opacity: show ? 1 : 0,
        transform: show ? "translateX(0) scale(1)" : "translateX(8px) scale(0.96)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
        pointerEvents: "none", ...style,
      }}
    >
      {children}
    </div>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
      color: "#64748b", marginBottom: "7px",
    }}>{children}</div>
  );
}

function FieldRow({ w }: { w: string }) {
  return (
    <div style={{
      height: "9px", width: w, borderRadius: "3px", marginBottom: "5px",
      background: "rgba(15,23,42,0.1)",
    }} />
  );
}
