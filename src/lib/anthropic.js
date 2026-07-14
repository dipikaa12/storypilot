import { loadSettings } from './storage'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

export function getApiKey() {
  const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (envKey?.trim()) return envKey.trim()
  const settings = loadSettings()
  return settings.apiKey?.trim() ?? ''
}

export async function callAnthropic(prompt) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('No API key configured. Add your key in Settings.')
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    let message = `API request failed (${response.status})`
    try {
      const error = await response.json()
      message = error?.error?.message ?? message
    } catch {
      // use default message
    }
    throw new Error(message)
  }

  const data = await response.json()
  const text = data.content?.find((block) => block.type === 'text')?.text
  if (!text) throw new Error('No text content in API response')
  return text
}
