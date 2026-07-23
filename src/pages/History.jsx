import { useState, useEffect } from 'react'
import { useWorkstream } from '../hooks/useWorkstream'
import { loadHistory, deleteHistoryRecord, clearHistory } from '../lib/storage'

export default function History() {
  const { activeWorkstream } = useWorkstream()
  const [records, setRecords] = useState([])
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  // Load and filter records when active workstream changes
  useEffect(() => {
    if (!activeWorkstream) return
    const all = loadHistory()
    const filtered = all
      .filter(r => r.workstreamId === activeWorkstream.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    setRecords(filtered)
  }, [activeWorkstream])

  // Filter by search term
  const visible = records.filter(r =>
    r.input.toLowerCase().includes(search.toLowerCase())
  )

  return (
  <div className="max-w-4xl mx-auto p-6">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">History</h1>
      <span className="text-sm text-gray-500">{visible.length} records</span>
    </div>

    {/* Search */}
    <input
      type="text"
      placeholder="Search by requirement text..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />

    {/* Records list */}
    {visible.length === 0 ? (
      <p className="text-gray-400 text-sm">No records found.</p>
    ) : (
      <div className="space-y-3">
        {visible.map(record => (
          <div
            key={record.id}
            className="border border-gray-200 rounded-lg bg-white"
          >
            {/* Record header -- click to expand */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedId(
                expandedId === record.id ? null : record.id
              )}
            >
              {/* Expanded view */}
{expandedId === record.id && (
  <div className="border-t border-gray-200 p-4 space-y-4">
    
    {/* Full input */}
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Input</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.input}</p>
    </div>

    {/* Outputs */}
    {record.outputs?.stories && (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stories</p>
          <button
            onClick={() => navigator.clipboard.writeText(record.outputs.stories)}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Copy
          </button>
        </div>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-3">
          {record.outputs.stories}
        </pre>
      </div>
    )}

    {record.outputs?.jira && (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Jira</p>
          <button
            onClick={() => navigator.clipboard.writeText(record.outputs.jira)}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Copy
          </button>
        </div>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-3">
          {record.outputs.jira}
        </pre>
      </div>
    )}

    {record.outputs?.confluence && (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confluence</p>
          <button
            onClick={() => navigator.clipboard.writeText(record.outputs.confluence)}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Copy
          </button>
        </div>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-3">
          {record.outputs.confluence}
        </pre>
      </div>
    )}

    {/* Delete */}
      <div className="flex justify-end pt-2">
        {confirmDeleteId === record.id ? (
          <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Are you sure?</span>
            <button
              onClick={() => {
                deleteHistoryRecord(record.id)
                setRecords(prev => prev.filter(r => r.id !== record.id))
                setConfirmDeleteId(null)
                setExpandedId(null)
              }}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Yes, delete
          </button>
          <button
            onClick={() => setConfirmDeleteId(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
          <button
            onClick={e => {
              e.stopPropagation()
              setConfirmDeleteId(record.id)
            }}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        )}    
        </div>
      </div>
    )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {record.input.slice(0, 100)}...
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(record.createdAt).toLocaleString()}
                </p>
              </div>
              {/* Output badges */}
              <div className="flex gap-2 ml-4">
                {record.outputs?.stories && (
                  <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">Stories</span>
                )}
                {record.outputs?.jira && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Jira</span>
                )}
                {record.outputs?.confluence && (
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Confluence</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)
}
