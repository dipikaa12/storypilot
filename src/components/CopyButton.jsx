import { useState } from 'react'

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
