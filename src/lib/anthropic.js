import { loadSettings } from './storage'

const API_URL = '/api/chat'

export function getApiKey() {
  const settings = loadSettings()
  const localKey = settings.apiKey?.trim()
  if (localKey) return localKey
  return import.meta.env.VITE_ANTHROPIC_API_KEY?.trim() ?? ''
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
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      apiKey,
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