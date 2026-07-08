import { useState, useEffect, useCallback } from "react";
import { fetchAllRecords } from "./data/airtable.js";
import { CATEGORIES, AGE_GROUPS } from "./data/content.js";
import { downloadAsPDF, generatePlainText } from "./utils/download.js";

// ─── Icons (inline SVG, no dependency) ───────────────────────────────────────
const Icon = {
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Copy: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Reset: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
    </svg>
  ),
};

// ─── Category colours ─────────────────────────────────────────────────────────
const CAT_COLOURS = {
  "Gaming":               { bg: "#e8f4fd", accent: "#1a6fa8", dot: "#1a6fa8" },
  "Social Media":         { bg: "#fdf0fb", accent: "#8b2fc9", dot: "#8b2fc9" },
  "Safety":               { bg: "#fff4e6", accent: "#c45c00", dot: "#c45c00" },
  "Digital Relationships":{ bg: "#edfaf4", accent: "#1a7a4a", dot: "#1a7a4a" },
  "AI & Chatbots":        { bg: "#f0f0ff", accent: "#3d3db4", dot: "#3d3db4" },
};

// ─── Section component ────────────────────────────────────────────────────────
function Section({ label, children, accent }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: accent,
        borderBottom: `2px solid ${accent}20`,
        paddingBottom: 6, marginBottom: 12,
      }}>{label}</div>
      <div style={{ fontSize: 15, lineHeight: 1.7, color: "#2c2c3e" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Two-column grid ──────────────────────────────────────────────────────────
function TwoCol({ left, right }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 20, marginBottom: 28,
    }}>
      {left}{right}
    </div>
  );
}

// ─── Resource pill ────────────────────────────────────────────────────────────
function ResourceLine({ line }) {
  const [name, ...rest] = line.split(" — ");
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
      <span style={{ color: "#2d6a4f", marginTop: 3 }}>→</span>
      <span><strong>{name}</strong>{rest.length ? " — " + rest.join(" — ") : ""}</span>
    </div>
  );
}

// ─── Select control ───────────────────────────────────────────────────────────
function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#666" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%", padding: "10px 36px 10px 14px",
            fontSize: 15, fontFamily: "inherit",
            border: "2px solid " + (value ? "#2d6a4f" : "#ddd"),
            borderRadius: 8, background: "#fff",
            color: value ? "#1a1a2e" : "#999",
            appearance: "none", cursor: "pointer",
            transition: "border-color 0.15s",
            outline: "none",
          }}
        >
          <option value="">{placeholder}</option>
          {options.map(o => (
            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
          ))}
        </select>
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#888" }}>
          <Icon.ChevronDown />
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [category, setCategory]   = useState("");
  const [ageRange, setAgeRange]   = useState("");
  const [scenario, setScenario]   = useState("");

  const [result, setResult]       = useState(null);
  const [copied, setCopied]       = useState(false);

  // Load data once
  useEffect(() => {
    fetchAllRecords()
      .then(setRecords)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Derived lists from current selections
  const availableScenarios = [...new Set(
    records
      .filter(r => (!category || r.category === category) && (!ageRange || r.ageRange === ageRange))
      .map(r => r.scenario)
  )].sort();

  // Find result when all three are selected
  useEffect(() => {
    if (!category || !ageRange || !scenario) { setResult(null); return; }
    const found = records.find(
      r => r.category === category && r.ageRange === ageRange && r.scenario === scenario
    );
    setResult(found || null);
  }, [category, ageRange, scenario, records]);

  const reset = useCallback(() => {
    setCategory(""); setAgeRange(""); setScenario(""); setResult(null);
  }, []);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(generatePlainText(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colours = result ? CAT_COLOURS[result.category] : CAT_COLOURS["Gaming"];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fc", fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{
        background: "#1a1a2e", color: "#fff",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#2d6a4f", fontWeight: 600, marginBottom: 2 }}>
              Safe to Grow
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
              Digital Parenting Guidance
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#888", textAlign: "right" }}>
            For Irish Families
          </div>
        </div>
      </header>

      {/* Selector panel */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px" }}>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
            Choose a topic and your child's age to get guidance written for your situation.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Select
              label="Category"
              value={category}
              onChange={v => { setCategory(v); setScenario(""); }}
              options={CATEGORIES}
              placeholder="Select a topic…"
            />
            <Select
              label="Age Group"
              value={ageRange}
              onChange={v => { setAgeRange(v); setScenario(""); }}
              options={AGE_GROUPS.map(a => ({ value: a.range, label: `${a.label} (${a.range})` }))}
              placeholder="Select an age…"
            />
            <Select
              label="Scenario"
              value={scenario}
              onChange={setScenario}
              options={availableScenarios}
              placeholder={category && ageRange ? "Select a scenario…" : "Select topic & age first"}
            />
          </div>
          {(category || ageRange || scenario) && (
            <button
              onClick={reset}
              style={{
                marginTop: 14, display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, color: "#888", padding: 0,
              }}
            >
              <Icon.Reset /> Start over
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>

        {loading && (
          <div style={{ textAlign: "center", color: "#888", padding: 60 }}>Loading guidance…</div>
        )}

        {error && (
          <div style={{ background: "#fff4f4", border: "1px solid #fcc", borderRadius: 8, padding: 20, color: "#c00" }}>
            Could not load content: {error}
          </div>
        )}

        {!loading && !result && !error && (
          <div style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#666" }}>Select a topic, age, and scenario above</div>
            <div style={{ fontSize: 14, marginTop: 6, color: "#aaa" }}>Your tailored guidance will appear here</div>
          </div>
        )}

        {result && (
          <div style={{ animation: "fadeIn 0.25s ease" }}>

            {/* Result header */}
            <div style={{
              background: colours.bg,
              borderRadius: 12, padding: "24px 28px",
              marginBottom: 24,
              borderLeft: `4px solid ${colours.accent}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{
                      background: colours.accent, color: "#fff",
                      fontSize: 11, fontWeight: 600, padding: "2px 10px",
                      borderRadius: 20, letterSpacing: "0.05em",
                    }}>{result.category}</span>
                    <span style={{ fontSize: 13, color: colours.accent, fontWeight: 500 }}>
                      {result.ageGroup} · Ages {result.ageRange}
                    </span>
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", marginBottom: 8, letterSpacing: "-0.02em" }}>
                    {result.scenario}
                  </h1>
                  <p style={{ fontSize: 15, color: "#444", fontStyle: "italic", lineHeight: 1.6 }}>
                    {result.introLine}
                  </p>
                </div>
                {/* Download buttons */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={handleCopy}
                    title="Copy as plain text"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                      background: "#fff", border: `1.5px solid ${colours.accent}`,
                      color: colours.accent, cursor: "pointer",
                    }}
                  >
                    {copied ? <><Icon.Check /> Copied</> : <><Icon.Copy /> Copy</>}
                  </button>
                  <button
                    onClick={() => downloadAsPDF(result)}
                    title="Download as PDF"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                      background: colours.accent, border: "none",
                      color: "#fff", cursor: "pointer",
                    }}
                  >
                    <Icon.Download /> Download PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Content card */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

              <Section label="The Issue" accent={colours.accent}>
                {result.issue}
              </Section>

              <Section label="Why It Matters" accent={colours.accent}>
                {result.whyItMatters}
              </Section>

              <TwoCol
                left={
                  <div style={{ background: "#f7fdf9", borderRadius: 10, padding: "18px 20px" }}>
                    <Section label="What Parents Can Do" accent={colours.accent}>
                      {result.whatParentsCan}
                    </Section>
                  </div>
                }
                right={
                  <div style={{ background: "#f7f8ff", borderRadius: 10, padding: "18px 20px" }}>
                    <Section label="What Children Can Do" accent={colours.accent}>
                      {result.whatChildrenCan}
                    </Section>
                  </div>
                }
              />

              <Section label="Conversation Starters to Build Trust" accent={colours.accent}>
                <div style={{
                  background: "#fffbf0", borderLeft: `3px solid ${colours.accent}`,
                  borderRadius: "0 8px 8px 0", padding: "14px 18px",
                  fontStyle: "italic", color: "#3a3a5c",
                }}>
                  {result.conversationStarters}
                </div>
              </Section>

              {/* Irish Support */}
              <div style={{
                background: "#f0faf4", border: "1.5px solid #b7e4c7",
                borderRadius: 10, padding: "18px 22px", marginBottom: 28,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#2d6a4f", marginBottom: 12,
                }}>Irish Support</div>
                {result.irishSupport.split('\n').filter(Boolean).map((line, i) => (
                  <ResourceLine key={i} line={line} />
                ))}
              </div>

              {/* Further Reading */}
              {result.furtherReading && (
                <details style={{ marginBottom: 16 }}>
                  <summary style={{
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    color: colours.accent, padding: "8px 0",
                    userSelect: "none", listStyle: "none",
                  }}>
                    ↓ Further Reading
                  </summary>
                  <div style={{ paddingTop: 12, fontSize: 14, color: "#555", lineHeight: 1.8 }}>
                    {result.furtherReading.split('\n').filter(Boolean).map((line, i) => (
                      <div key={i} style={{ marginBottom: 4 }}>→ {line}</div>
                    ))}
                  </div>
                </details>
              )}

              {/* Sources */}
              {result.sources && (
                <details>
                  <summary style={{
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    color: "#888", padding: "8px 0",
                    userSelect: "none", listStyle: "none",
                  }}>
                    ↓ Sources
                  </summary>
                  <div style={{ paddingTop: 10, fontSize: 12, color: "#999", lineHeight: 1.8 }}>
                    {result.sources.split('\n').filter(Boolean).map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </details>
              )}

            </div>

            {/* Version footer */}
            <div style={{ fontSize: 11, color: "#bbb", textAlign: "right", marginTop: 12 }}>
              v{result.version} · Last updated {result.lastUpdated}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        select:focus { border-color: #2d6a4f !important; box-shadow: 0 0 0 3px #2d6a4f22; }
        details summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}
