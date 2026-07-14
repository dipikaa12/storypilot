export const NS = 'sp:'

const KEYS = {
  workstreams: `${NS}workstreams`,
  activeWorkstreamId: `${NS}activeWorkstreamId`,
  settings: `${NS}settings`,
  history: `${NS}history`,
}

export const DEFAULT_SETTINGS = {
  apiKey: '',
  defaultOutputs: ['stories', 'jira', 'confluence'],
  defaultStoryFormat: 'standard',
  defaultIncludeAC: true,
  defaultIncludeDoD: false,
  mcpEnabled: false,
  mcpAtlassianUrl: '',
  mcpAtlassianToken: '',
}

const SEED_WORKSTREAMS = [
  {
    id: 'ws-edw',
    name: 'EDW',
    description: 'Enterprise Data Warehouse feeds and data platform',
    color: '#0D9488',
    personas: 'Data engineer, analytics engineer, BI developer',
    terminology: 'EDW = Enterprise Data Warehouse. Feed = scheduled data extract from a source system.',
    exampleStory: 'As a data engineer, I want to ingest the CRM daily extract so that customer data is available in the EDW.',
    definitionOfDone: 'Pipeline tested, data quality checks pass, documentation updated',
    confluenceTemplate: '## Overview\n## Goals\n## User stories\n## Dependencies\n## Open questions',
    availableFeeds: 'customer_profile, usage_summary, billing_history, crm_daily',
    confluenceSpaceKey: '',
    confluenceParentPageId: '',
    jiraProjectKey: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ws-portal',
    name: 'Customer Portal',
    description: 'Front-end portal consuming EDW feeds',
    color: '#534AB7',
    personas: 'Residential customer, CSR, portal admin',
    terminology: 'EDW = Enterprise Data Warehouse. CRM feed = Salesforce daily extract.',
    exampleStory: 'As a residential customer, I want to view my usage history so that I can understand my consumption patterns.',
    definitionOfDone: 'AC met, UI tested, PO sign-off, no open blockers',
    confluenceTemplate: '## Overview\n## Goals\n## User stories\n## Dependencies\n## Open questions',
    availableFeeds: 'customer_profile, usage_summary, billing_history',
    confluenceSpaceKey: 'PORTAL',
    confluenceParentPageId: '',
    jiraProjectKey: 'PORT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadWorkstreams() {
  const existing = read(KEYS.workstreams, null)
  if (existing?.length) return existing
  write(KEYS.workstreams, SEED_WORKSTREAMS)
  return SEED_WORKSTREAMS
}

export function saveWorkstreams(workstreams) {
  write(KEYS.workstreams, workstreams)
}

export function loadActiveWorkstreamId(workstreams) {
  const stored = read(KEYS.activeWorkstreamId, null)
  if (stored && workstreams.some((ws) => ws.id === stored)) return stored
  const fallback = workstreams[0]?.id ?? null
  if (fallback) write(KEYS.activeWorkstreamId, fallback)
  return fallback
}

export function saveActiveWorkstreamId(id) {
  write(KEYS.activeWorkstreamId, id)
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) }
}

export function saveSettings(settings) {
  write(KEYS.settings, settings)
}

export function loadHistory() {
  return read(KEYS.history, [])
}

export function saveHistory(history) {
  write(KEYS.history, history)
}

export function createWorkstreamId() {
  return crypto.randomUUID()
}
