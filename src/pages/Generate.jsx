import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import OutputTabs from '../components/OutputTabs'
import { useApp } from '../context/AppContext'
import { useWorkstream } from '../hooks/useWorkstream'
import { callAnthropic, getApiKey } from '../lib/anthropic'
import { consumePendingRequirements, consumePendingGapsText } from "../lib/storage";
import {
  confluencePrompt,
  storiesPrompt,
} from '../lib/prompts'

const OUTPUT_OPTIONS = [
  { key: 'stories', label: 'Stories' },
  { key: 'confluence', label: 'Confluence' },
]

const PROMPT_MAP = {
  stories: storiesPrompt,
  confluence: confluencePrompt,
}

export default function Generate() {
  const { activeWorkstream } = useWorkstream()
  const { history, setHistory } = useApp()

  const [mode, setMode] = useState('single')
  const [input, setInput] = useState('')
  const [epic, setEpic] = useState('')
  const [storyFormat, setStoryFormat] = useState('standard')
  const [include, setInclude] = useState('ac')
  const [selectedOutputs, setSelectedOutputs] = useState(['stories', 'confluence'])
  const [outputs, setOutputs] = useState({ stories: '', confluence: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasGenerated, setHasGenerated] = useState(false)
  const [inputError, setInputError] = useState('')

  const hasApiKey = Boolean(getApiKey())

  useEffect(() => {
  const pendingReqs = consumePendingRequirements();
  if (pendingReqs?.length) {
    const combined = pendingReqs
      .map((r) => `[${r.category}] ${r.requirement}`)
      .join("\n");
    setInput(combined);
    return;
  }

  const gapsText = consumePendingGapsText();
  if (gapsText) {
    setInput(gapsText);
  }
}, []);

  function toggleOutput(key) {
    setSelectedOutputs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setError('')
    setInputError('')

    if (!input.trim()) {
      setInputError('Requirement or BRD excerpt is required.')
      return
    }
    if (!hasApiKey) return
    if (!activeWorkstream) {
      setError('No active workstream. Configure one in Context.')
      return
    }
    if (!selectedOutputs.length) {
      setError('Select at least one output type.')
      return
    }

    const opts = { storyFormat, include, epic }

    setLoading(true)
    const results = { stories: '', confluence: '' }

    try {
      for (const key of selectedOutputs) {
        const promptFn = PROMPT_MAP[key]
        const prompt = promptFn(input.trim(), activeWorkstream, opts)
        results[key] = await callAnthropic(prompt)
      }

      setOutputs(results)
      setHasGenerated(true)

      const record = {
        id: crypto.randomUUID(),
        workstreamId: activeWorkstream.id,
        workstreamName: activeWorkstream.name,
        input: input.trim(),
        mode: 'single',
        outputs: {
          stories: results.stories,
          confluence: results.confluence,
        },
        batchItems: [],
        pushed: { confluence: false },
        createdAt: new Date().toISOString(),
      }
      setHistory([record, ...history])
    } catch (err) {
      setError(err.message ?? 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Generate</h1>
        <p className="mt-1 text-sm text-gray-600">
          Convert a requirement into stories and Confluence pages.
          {activeWorkstream && (
            <span>
              {' '}
              Using <span className="font-medium">{activeWorkstream.name}</span> context.
            </span>
          )}
        </p>
      </div>

      {!hasApiKey && (
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
          No API key configured.{' '}
          <Link to="/settings" className="font-medium underline hover:text-amber-900">
            Go to Settings
          </Link>{' '}
          to add your Anthropic API key.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Input panel */}
        <form onSubmit={handleGenerate} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex rounded-md border border-gray-200 p-0.5 bg-gray-50">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={[
                'flex-1 px-3 py-1.5 text-sm font-medium rounded',
                mode === 'single' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600',
              ].join(' ')}
            >
              Single
            </button>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex-1 px-3 py-1.5 text-sm font-medium rounded text-gray-400 cursor-not-allowed"
            >
              Batch <span className="text-xs">(coming soon)</span>
            </button>
          </div>

          <div>
            <label htmlFor="requirement" className="block text-sm font-medium text-gray-700 mb-1">
              Requirement or BRD excerpt <span className="text-red-500">*</span>
            </label>
            <textarea
              id="requirement"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (e.target.value.trim()) setInputError('')
              }}
              rows={8}
              className={`${inputClass} resize-y ${inputError ? 'border-red-400' : ''}`}
              placeholder="Paste a requirement or BRD excerpt..."
            />
            {inputError && <p className="mt-1 text-sm text-red-600">{inputError}</p>}
          </div>

          <div>
            <label htmlFor="epic" className="block text-sm font-medium text-gray-700 mb-1">
              Epic / theme <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="epic"
              type="text"
              value={epic}
              onChange={(e) => setEpic(e.target.value)}
              className={inputClass}
              placeholder="e.g. Customer self-service"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="story-format" className="block text-sm font-medium text-gray-700 mb-1">
                Story format
              </label>
              <select
                id="story-format"
                value={storyFormat}
                onChange={(e) => setStoryFormat(e.target.value)}
                className={inputClass}
              >
                <option value="standard">As a / I want / So that</option>
                <option value="job">Job story</option>
                <option value="gherkin">Gherkin</option>
              </select>
            </div>

            <div>
              <label htmlFor="include" className="block text-sm font-medium text-gray-700 mb-1">
                Include
              </label>
              <select
                id="include"
                value={include}
                onChange={(e) => setInclude(e.target.value)}
                className={inputClass}
              >
                <option value="ac">Acceptance criteria</option>
                <option value="ac+dod">AC + Definition of done</option>
                <option value="stories-only">Stories only</option>
              </select>
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">Outputs</legend>
            <div className="flex flex-wrap gap-4">
              {OUTPUT_OPTIONS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedOutputs.includes(key)}
                    onChange={() => toggleOutput(key)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading || !hasApiKey || !selectedOutputs.length}
            className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </form>

        {/* Output panel */}
        <div className="bg-white border border-gray-200 rounded-lg min-h-[400px] flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="mt-3 text-sm text-gray-600">Generating outputs…</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <p className="text-sm font-medium text-red-700">Generation failed</p>
                <p className="mt-1 text-sm text-gray-600">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && !hasGenerated && (
            <div className="flex-1 flex items-center justify-center p-8">
              <p className="text-sm text-gray-500">
                Generated output will appear here.
              </p>
            </div>
          )}

          {!loading && !error && hasGenerated && (
            <OutputTabs outputs={outputs} selectedOutputs={selectedOutputs} />
          )}
        </div>
      </div>
    </div>
  )
}
