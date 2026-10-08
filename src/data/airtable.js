// ─── Airtable connector ───────────────────────────────────────────────────────
// Set these two values in a .env file at project root:
//   VITE_AIRTABLE_TOKEN=your_personal_access_token
//   VITE_AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
//
// In Airtable: Settings → API → Personal access tokens → Create token
// Scopes needed: data.records:read
// The base ID is in your Airtable URL: airtable.com/appXXXX/...

const TOKEN   = import.meta.env.VITE_AIRTABLE_TOKEN;
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const TABLE   = "Content%20Database"; // URL-encoded table name

// Map Airtable field names → our internal camelCase keys
function mapRecord(r) {
  const f = r.fields;
  return {
    id:                   r.id,
    recordId:             f["Record ID"]             || "",
    scenario:             f["Scenario"]              || "",
    category:             f["Category"]              || "",
    ageGroup:             f["Age Group"]             || "",
    ageRange:             f["Age Range"]             || "",
    introLine:            f["Intro Line"]            || "",
    issue:                f["The Issue"]             || "",
    whyItMatters:         f["Why It Matters"]        || "",
    whatParentsCan:       f["What Parents Can Do"]   || "",
    whatChildrenCan:      f["What Children Can Do"]  || "",
    conversationStarters: f["Conversation Starters"] || "",
    irishSupport:         f["Irish Support"]         || "",
    furtherReading:       f["Further Reading"]       || "",
    sources:              f["Sources"]               || "",
    status:               f["Status"]                || "",
    version:              f["Version"]               || "",
    lastUpdated:          f["Last Updated"]          || "",
  };
}

export async function fetchAllRecords() {
  if (!TOKEN || !BASE_ID) {
    // Fall back to sample data in development
    const { RECORDS } = await import("./content.js");
    return RECORDS;
  }

  let all = [];
  let offset = null;

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE}`
    );
    url.searchParams.set("filterByFormula", "{Status}='Published'");
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
    const data = await res.json();
    all = all.concat(data.records.map(mapRecord));
    offset = data.offset || null;
  } while (offset);

  return all;
}
