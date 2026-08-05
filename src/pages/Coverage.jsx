import { useState } from 'react'
import { useWorkstream } from '../hooks/useWorkstream'
import { callAnthropic } from '../lib/anthropic'
import { coveragePrompt } from '../lib/prompts'
import { useNavigate } from 'react-router-dom'
import { setPendingGapsText } from '../lib/storage'

export default function Coverage() {
  const { activeWorkstream } = useWorkstream()
  const [brdInput, setBrdInput] = useState('')
  const [storiesInput, setStoriesInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  async function analyse() {
    if (!brdInput.trim() || !storiesInput.trim()) {
      setError('Please add both BRD requirements and existing stories.')
      return
    }
    setLoading(true)
    setError('')
    setOutput('')
    try {
      const prompt = coveragePrompt(brdInput, storiesInput, activeWorkstream)
      const result = await callAnthropic(prompt)
      setOutput(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Coverage Analysis</h1>
      <p className="text-sm text-gray-500 mb-6">
        Map your BRD requirements against existing stories to find gaps.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            BRD Requirements
          </label>
          <textarea
            value={brdInput}
            onChange={e => setBrdInput(e.target.value)}
            placeholder="Paste your BRD requirements list here -- numbered or bulleted, one per line..."
            className="w-full h-64 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Existing User Stories
          </label>
          <textarea
            value={storiesInput}
            onChange={e => setStoriesInput(e.target.value)}
            placeholder="Paste your existing user stories here -- all of them..."
            className="w-full h-64 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      <button
        onClick={analyse}
        disabled={loading}
        className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed mb-6"
      >
        {loading ? 'Analysing...' : 'Analyse Coverage'}
      </button>

      {output && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              Coverage Report
            </h2>
            <button
              onClick={copy}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {output}
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                const notCovered = output.split('NOT COVERED')[1] || output
                setPendingGapsText(notCovered.trim())
                navigate('/generate')
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Generate stories for gaps →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
