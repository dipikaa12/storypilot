import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWorkstream } from "../hooks/useWorkstream";
import { callAnthropic, getApiKey } from "../lib/anthropic";
import { analysisPrompt } from "../lib/prompts";
import { toPlainText, toJSON } from "../lib/requirementFormat";
import { setPendingRequirements } from "../lib/storage";
import CopyButton from "../components/CopyButton";

export default function Analysis() {
  const navigate = useNavigate();
  const { activeWorkstream } = useWorkstream();

  const [rawInput, setRawInput] = useState("");
  const [requirements, setRequirements] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [view, setView] = useState("plain");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasApiKey = Boolean(getApiKey());

  async function handleAnalyze() {
    if (!rawInput.trim() || !hasApiKey) return;
    setError("");
    setRequirements(null);

    setLoading(true);
try {
  const prompt = analysisPrompt(rawInput.trim(), activeWorkstream);
  const response = await callAnthropic(prompt);

  // Defensive strip: models sometimes wrap JSON in ```json fences even
  // when told not to. Strip before parsing rather than trusting compliance.
  const cleaned = response
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");

  // Heuristic truncation check: a complete JSON array must end with "]".
  // Not as precise as reading stop_reason directly, but callAnthropic
  // currently returns plain text, not the full API response, so this
  // avoids guessing at an unverified option on that function.
  if (!cleaned.endsWith("]")) {
    throw new Error(
      "Response appears to have been cut off before completing. Try analyzing a smaller section, or wait for batch mode to handle larger documents."
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("Raw response that failed to parse:", response);
    throw parseErr;
  }

  setRequirements(parsed);
  setSelectedIds(new Set(parsed.map((r) => r.id)));
} catch (err) {
  setError(
    err.message?.includes("JSON") && !err.message?.includes("cut off")
      ? "Model response wasn't valid JSON — check the browser console for the raw response. Try again or trim the input."
      : err.message ?? "Analysis failed. Please try again."
  );
} finally {
  setLoading(false);
}
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!requirements) return;
    setSelectedIds((prev) =>
      prev.size === requirements.length ? new Set() : new Set(requirements.map((r) => r.id))
    );
  }

  function handleSendToGenerate() {
    const selected = requirements.filter((r) => selectedIds.has(r.id));
    if (!selected.length) return;
    setPendingRequirements(selected);
    navigate("/generate");
  }

  const renderedText =
    requirements && (view === "plain" ? toPlainText(requirements) : toJSON(requirements));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Analysis</h1>
        <p className="mt-1 text-sm text-gray-600">
          Paste raw source content — Excel data, report descriptions, stakeholder notes —
          and extract it into structured, categorized requirements before generating stories.
          {activeWorkstream && (
            <span>
              {" "}
              Using <span className="font-medium">{activeWorkstream.name}</span> context.
            </span>
          )}
        </p>
      </div>

      {!hasApiKey && (
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
          No API key configured.{" "}
          <Link to="/settings" className="font-medium underline hover:text-amber-900">
            Go to Settings
          </Link>{" "}
          to add your Anthropic API key.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Source content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="source"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={10}
            placeholder="Paste BRD content, notes, or table data here..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
          />
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !hasApiKey || !rawInput.trim()}
          className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {requirements && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-semibold text-gray-900">
                {requirements.length} requirement{requirements.length !== 1 ? "s" : ""} extracted
              </h2>
              <button onClick={toggleAll} className="text-xs text-indigo-600 hover:underline">
                {selectedIds.size === requirements.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setView("plain")}
                className={`px-2 py-1 rounded ${
                  view === "plain" ? "bg-gray-900 text-white" : "text-gray-500"
                }`}
              >
                Plain text
              </button>
              <button
                onClick={() => setView("json")}
                className={`px-2 py-1 rounded ${
                  view === "json" ? "bg-gray-900 text-white" : "text-gray-500"
                }`}
              >
                JSON
              </button>
              <CopyButton text={renderedText} />
            </div>
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100">
            {requirements.map((req) => (
              <label
                key={req.id}
                className="flex items-start gap-3 p-3 text-sm hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(req.id)}
                  onChange={() => toggleSelected(req.id)}
                  className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-indigo-600">{req.category}</span>
                    <span className="text-xs text-gray-400">{req.id}</span>
                  </div>
                  <p className="text-gray-800">{req.requirement}</p>
                  <p className="text-xs text-gray-400 mt-0.5">"{req.sourceExcerpt}"</p>
                </div>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSendToGenerate}
            disabled={!selectedIds.size}
            className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate stories for {selectedIds.size} selected
          </button>
        </div>
      )}
    </div>
  );
}
