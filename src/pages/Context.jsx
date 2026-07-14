import { useState } from 'react'
import { useWorkstream } from '../hooks/useWorkstream'

const PRESET_COLORS = [
  '#1D9E75',
  '#534AB7',
  '#0D9488',
  '#2563EB',
  '#D97706',
  '#DC2626',
]

const EMPTY_FORM = {
  name: '',
  description: '',
  color: PRESET_COLORS[0],
  personas: '',
  terminology: '',
  exampleStory: '',
  definitionOfDone: '',
  confluenceTemplate: '',
  availableFeeds: '',
  confluenceSpaceKey: '',
  confluenceParentPageId: '',
  jiraProjectKey: '',
}

function workstreamToForm(ws) {
  return {
    name: ws.name ?? '',
    description: ws.description ?? '',
    color: ws.color ?? PRESET_COLORS[0],
    personas: ws.personas ?? '',
    terminology: ws.terminology ?? '',
    exampleStory: ws.exampleStory ?? '',
    definitionOfDone: ws.definitionOfDone ?? '',
    confluenceTemplate: ws.confluenceTemplate ?? '',
    availableFeeds: ws.availableFeeds ?? '',
    confluenceSpaceKey: ws.confluenceSpaceKey ?? '',
    confluenceParentPageId: ws.confluenceParentPageId ?? '',
    jiraProjectKey: ws.jiraProjectKey ?? '',
  }
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

const textareaClass = `${inputClass} resize-y min-h-[80px]`

export default function Context() {
  const {
    workstreams,
    activeWorkstreamId,
    addWorkstream,
    updateWorkstream,
    deleteWorkstream,
  } = useWorkstream()

  const [view, setView] = useState('list')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [nameError, setNameError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const canDelete = workstreams.length > 1

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setNameError('')
    setView('form')
  }

  function openEdit(ws) {
    setEditingId(ws.id)
    setForm(workstreamToForm(ws))
    setNameError('')
    setView('form')
  }

  function backToList() {
    setView('list')
    setEditingId(null)
    setForm(EMPTY_FORM)
    setNameError('')
    setConfirmDeleteId(null)
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'name' && value.trim()) setNameError('')
  }

  function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setNameError('Name is required.')
      return
    }

    if (editingId) {
      const existing = workstreams.find((ws) => ws.id === editingId)
      if (existing) {
        updateWorkstream({ ...existing, ...form, name: form.name.trim() })
      }
    } else {
      addWorkstream({ ...form, name: form.name.trim() })
    }

    backToList()
  }

  function handleDelete(id) {
    if (!canDelete) return
    deleteWorkstream(id)
    setConfirmDeleteId(null)
  }

  if (view === 'form') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {editingId ? 'Edit workstream' : 'New workstream'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Context fields are injected into every generation for this workstream.
            </p>
          </div>
          <button
            type="button"
            onClick={backToList}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
          <Field label="Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={`${inputClass} ${nameError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : ''}`}
              placeholder="e.g. Customer Portal"
            />
            {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
          </Field>

          <Field label="Description">
            <input
              type="text"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className={inputClass}
              placeholder="Short summary of this workstream"
            />
          </Field>

          <Field label="Color">
            <div className="flex gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateField('color', color)}
                  className={[
                    'w-8 h-8 rounded-full border-2 transition-transform',
                    form.color === color
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent hover:scale-105',
                  ].join(' ')}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </Field>

          <Field label="Personas">
            <textarea
              value={form.personas}
              onChange={(e) => updateField('personas', e.target.value)}
              className={textareaClass}
              placeholder="Who uses or benefits from this workstream?"
            />
          </Field>

          <Field label="Terminology">
            <textarea
              value={form.terminology}
              onChange={(e) => updateField('terminology', e.target.value)}
              className={textareaClass}
              placeholder="Domain terms and abbreviations the model should know"
            />
          </Field>

          <Field label="Style reference — paste one of your best existing stories">
            <textarea
              value={form.exampleStory}
              onChange={(e) => updateField('exampleStory', e.target.value)}
              className={textareaClass}
              placeholder="As a [persona], I want to [action] so that [outcome]..."
            />
          </Field>

          <Field label="Definition of done">
            <textarea
              value={form.definitionOfDone}
              onChange={(e) => updateField('definitionOfDone', e.target.value)}
              className={textareaClass}
              placeholder="What must be true before a story is considered complete?"
            />
          </Field>

          <Field label="Confluence template structure">
            <textarea
              value={form.confluenceTemplate}
              onChange={(e) => updateField('confluenceTemplate', e.target.value)}
              className={textareaClass}
              placeholder="## Overview&#10;## Goals&#10;## User stories"
            />
          </Field>

          <Field label="EDW feeds available to this workstream">
            <textarea
              value={form.availableFeeds}
              onChange={(e) => updateField('availableFeeds', e.target.value)}
              className={textareaClass}
              placeholder="customer_profile, usage_summary, billing_history"
            />
          </Field>

          <div className="pt-2 border-t border-gray-200">
            <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-4">
              v2 — MCP integration
            </h2>
            <div className="space-y-5">
              <Field label="Confluence space key (v2)">
                <input
                  type="text"
                  value={form.confluenceSpaceKey}
                  onChange={(e) => updateField('confluenceSpaceKey', e.target.value)}
                  className={inputClass}
                  placeholder="PORTAL"
                />
              </Field>

              <Field label="Confluence parent page ID (v2)">
                <input
                  type="text"
                  value={form.confluenceParentPageId}
                  onChange={(e) => updateField('confluenceParentPageId', e.target.value)}
                  className={inputClass}
                  placeholder="123456"
                />
              </Field>

              <Field label="Jira project key (v2)">
                <input
                  type="text"
                  value={form.jiraProjectKey}
                  onChange={(e) => updateField('jiraProjectKey', e.target.value)}
                  className={inputClass}
                  placeholder="PORT"
                />
              </Field>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Save workstream
            </button>
            <button
              type="button"
              onClick={backToList}
              className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Workstream Context</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage workstreams and their generation context.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          New workstream
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {workstreams.map((ws) => {
          const isActive = ws.id === activeWorkstreamId
          const isConfirming = confirmDeleteId === ws.id

          return (
            <div
              key={ws.id}
              className={[
                'bg-white border rounded-lg p-4 flex flex-col',
                isActive ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-4 h-4 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: ws.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900 truncate">{ws.name}</h2>
                    {isActive && (
                      <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  {ws.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{ws.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {isConfirming ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Are you sure?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(ws.id)}
                      className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openEdit(ws)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(ws.id)}
                      disabled={!canDelete}
                      title={!canDelete ? 'At least one workstream is required' : undefined}
                      className="px-3 py-1.5 text-sm font-medium text-red-700 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
