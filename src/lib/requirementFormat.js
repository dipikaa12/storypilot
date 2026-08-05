/**
 * ADD AS src/lib/requirementFormat.js
 *
 * Both view functions take the SAME structured array returned by analysisPrompt.
 * The toggle in Analysis.jsx switches which of these renders — it never changes
 * what the model generates. This avoids maintaining two parse paths.
 */

/**
 * Groups requirements by category and renders as a numbered plain-text list,
 * matching the "1. [Category] Requirement text" format.
 * @param {Array<{id: string, requirement: string, category: string, sourceExcerpt: string}>} requirements
 * @returns {string}
 */
export function toPlainText(requirements) {
  if (!requirements?.length) return "No requirements extracted.";

  const grouped = requirements.reduce((acc, req) => {
    const key = req.category || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(req);
    return acc;
  }, {});

  let counter = 1;
  const lines = [];

  for (const [category, reqs] of Object.entries(grouped)) {
    lines.push(`\n${category}`);
    lines.push("-".repeat(category.length));
    for (const req of reqs) {
      lines.push(`${counter}. ${req.requirement}`);
      counter += 1;
    }
  }

  return lines.join("\n").trim();
}

/**
 * Pretty-printed JSON view of the same structured data.
 * @param {Array} requirements
 * @returns {string}
 */
export function toJSON(requirements) {
  return JSON.stringify(requirements, null, 2);
}
