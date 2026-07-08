// ─── Download utilities ───────────────────────────────────────────────────────

// Generate a clean print-formatted HTML page and trigger download as PDF
// Works without any server or library — uses the browser's built-in print-to-PDF
export function downloadAsPDF(record) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Safe to Grow — ${record.scenario} (${record.ageRange})</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'DM Sans', sans-serif;
    font-size: 11pt;
    line-height: 1.65;
    color: #1a1a2e;
    max-width: 680px;
    margin: 0 auto;
    padding: 40px 32px;
  }
  .header {
    border-bottom: 3px solid #2d6a4f;
    padding-bottom: 16px;
    margin-bottom: 28px;
  }
  .brand { font-size: 10pt; color: #2d6a4f; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
  h1 { font-family: 'DM Serif Display', serif; font-size: 22pt; line-height: 1.2; margin: 6px 0 4px; }
  .meta { font-size: 9.5pt; color: #666; }
  .intro { font-size: 12pt; color: #2d6a4f; font-style: italic; margin: 20px 0 28px; line-height: 1.5; }
  .section { margin-bottom: 24px; }
  .section-label {
    font-size: 8.5pt;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #2d6a4f;
    margin-bottom: 6px;
    padding-bottom: 3px;
    border-bottom: 1px solid #d4edda;
  }
  .section p { margin-bottom: 8px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .resources { background: #f0faf4; border-left: 3px solid #2d6a4f; padding: 14px 16px; border-radius: 0 6px 6px 0; }
  .resources p { font-size: 10pt; margin-bottom: 4px; }
  .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #eee; font-size: 8.5pt; color: #999; display: flex; justify-content: space-between; }
  @media print {
    body { padding: 20px; }
    .two-col { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="brand">Safe to Grow</div>
  <h1>${record.scenario}</h1>
  <div class="meta">${record.ageGroup} · Ages ${record.ageRange} · ${record.category}</div>
</div>

<div class="intro">${record.introLine}</div>

<div class="section">
  <div class="section-label">The Issue</div>
  <p>${record.issue}</p>
</div>

<div class="section">
  <div class="section-label">Why It Matters</div>
  <p>${record.whyItMatters}</p>
</div>

<div class="two-col">
  <div class="section">
    <div class="section-label">What Parents Can Do</div>
    <p>${record.whatParentsCan}</p>
  </div>
  <div class="section">
    <div class="section-label">What Children Can Do</div>
    <p>${record.whatChildrenCan}</p>
  </div>
</div>

<div class="section">
  <div class="section-label">Conversation Starters</div>
  <p>${record.conversationStarters}</p>
</div>

<div class="resources">
  <div class="section-label" style="border-bottom:none;margin-bottom:10px;">Irish Support</div>
  ${record.irishSupport.split('\n').map(l => `<p>${l}</p>`).join('')}
</div>

${record.furtherReading ? `
<div class="section" style="margin-top:20px;">
  <div class="section-label">Further Reading</div>
  ${record.furtherReading.split('\n').map(l => `<p>${l}</p>`).join('')}
</div>` : ''}

<div class="footer">
  <span>safetogrow.ie</span>
  <span>Version ${record.version} · Updated ${record.lastUpdated}</span>
</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}

// Generate plain text version for copy/paste
export function generatePlainText(record) {
  return `SAFE TO GROW
${record.scenario}
${record.ageGroup} · Ages ${record.ageRange} · ${record.category}

${record.introLine}

THE ISSUE
${record.issue}

WHY IT MATTERS
${record.whyItMatters}

WHAT PARENTS CAN DO
${record.whatParentsCan}

WHAT CHILDREN CAN DO
${record.whatChildrenCan}

CONVERSATION STARTERS
${record.conversationStarters}

IRISH SUPPORT
${record.irishSupport}

FURTHER READING
${record.furtherReading}

---
Version ${record.version} · Updated ${record.lastUpdated}
safetogrow.ie`;
}
