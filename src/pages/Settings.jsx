import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useStorage } from '../hooks/useStorage'
import { DEFAULT_SETTINGS, NS } from '../lib/storage'

const SETTINGS_KEY = `${NS}settings`
const MASKED = '••••••••••••••••••••'

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

function loadMergedSettings(read) {
  return { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) }
}

export default function Settings() {
  const { read, write } = useStorage()
  const { updateSettings } = useApp()

  const storedKeyRef = useRef('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [hasStoredKey, setHasStoredKey] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    const settings = loadMergedSettings(read)
    if (settings.apiKey) {
      storedKeyRef.current = settings.apiKey
      setHasStoredKey(true)
      setApiKeyInput(MASKED)
    }
  }, [read])

  function displayValue() {
    if (showKey && hasStoredKey && !isDirty) return storedKeyRef.current
    return apiKeyInput
  }

  function handleInputChange(value) {
    setIsDirty(true)
    setApiKeyInput(value)
    setSaved(false)
  }

  function handleSave(e) {
    e.preventDefault()

    let keyToSave = apiKeyInput.trim()
    if (!isDirty && hasStoredKey) {
      keyToSave = storedKeyRef.current
    } else if (isDirty && apiKeyInput === MASKED && hasStoredKey) {
      keyToSave = storedKeyRef.current
    }

    if (!keyToSave) return

    const merged = { ...loadMergedSettings(read), apiKey: keyToSave }
    write(SETTINGS_KEY, merged)
    updateSettings(merged)

    storedKeyRef.current = keyToSave
    setHasStoredKey(true)
    setIsDirty(false)
    setApiKeyInput(MASKED)
    setShowKey(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleRemove() {
    const merged = { ...loadMergedSettings(read), apiKey: '' }
    write(SETTINGS_KEY, merged)
    updateSettings(merged)

    storedKeyRef.current = ''
    setHasStoredKey(false)
    setIsDirty(false)
    setApiKeyInput('')
    setShowKey(false)
    setConfirmRemove(false)
    setSaved(false)
  }

  const canSave = hasStoredKey
    ? isDirty && apiKeyInput.trim().length > 0
    : apiKeyInput.trim().length > 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          API key, default preferences, and MCP configuration.
        </p>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg p-5 max-w-xl">
        <h2 className="text-base font-semibold text-gray-900">
          {hasStoredKey ? 'Update key' : 'API key'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Your Anthropic API key for story generation.
        </p>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
              Anthropic API key
            </label>
            <div className="flex gap-2">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={displayValue()}
                onChange={(e) => handleInputChange(e.target.value)}
                className={inputClass}
                placeholder="sk-ant-..."
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                disabled={!hasStoredKey && !apiKeyInput}
                className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!canSave}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            {saved && (
              <span className="text-sm text-green-700 font-medium">API key saved</span>
            )}
          </div>
        </form>

        {hasStoredKey && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {confirmRemove ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Remove API key?</span>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="text-sm font-medium text-red-700 hover:text-red-800"
              >
                Remove key
              </button>
            )}
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500">
          Your API key is stored in your browser only and never sent anywhere except directly
          to the Anthropic API.
        </p>
      </section>
    </div>
  )
}
