# StoryPilot — Product Requirements Hub
### Technical Specification & Decision Record
**Author:** Dipika Chawla  
**Status:** Approved for build  
**Version:** 1.1 (MCP integration added)

---

## 1. Problem statement

Converting BRDs into user stories, Jira tickets, and Confluence pages is repetitive, context-heavy work. The core pain is not the writing itself — it is maintaining consistency across stories written across multiple sprints, multiple workstreams, and multiple sessions. Every time a new chat is opened, the domain context (personas, terminology, story format, DoD) has to be re-explained from scratch, and output drifts from what was produced two sprints ago.

This tool solves that by storing workstream context persistently and injecting it silently into every generation, so output is consistent regardless of when or how often the tool is used.

---

## 2. What is MCP and why it matters here

MCP (Model Context Protocol) is an open standard introduced by Anthropic that lets AI models connect to external tools and data sources in a structured, consistent way. Think of it as a USB standard for AI integrations: instead of every tool requiring a custom REST integration, any service that implements MCP can plug into any MCP-compatible AI client.

An MCP server exposes a set of named tools (functions) that an AI model can call during a conversation. The model decides when to call a tool, calls it with structured arguments, gets a result back, and incorporates it into its response. From the developer's perspective, you configure which MCP servers are available — the model handles the rest.

### Why MCP matters for this project specifically

This project touches MCP in two distinct ways:

**During development (Cursor + dev MCPs)**  
Cursor supports MCP natively. Connecting filesystem and GitHub MCP servers means Cursor has live context about your repo — it can read your spec, write files, create branches, and commit code without you copy-pasting anything. This is where you first get hands-on MCP experience, in a low-stakes context as a developer tool.

**In the app itself (Atlassian MCP, v2)**  
The Anthropic API supports MCP servers as tools on API calls. In v2, the app will pass an Atlassian MCP server config alongside its API calls, enabling Claude to push generated content directly to Confluence pages and create Jira tickets — eliminating the copy-paste step entirely. The integration work is largely already done by the MCP server maintainer; you configure and connect it.

### The learning arc

By the end of v1 + v2, you will have:
- Used MCPs as a developer tool (Cursor + filesystem/GitHub MCPs)
- Understood how the Anthropic API exposes MCP tools to a client app
- Built and shipped an actual MCP-powered integration (Atlassian)

That is a concrete, demonstrable progression — not just theoretical knowledge of what MCPs are.

---

## 3. Scope

### In scope (v1)
- Workstream management (create, configure, switch)
- Story + Jira + Confluence generation from BRD input
- Batch mode: detect and split individual requirements from a pasted BRD section
- Coverage analysis: map existing stories against BRD requirements and flag gaps
- Generation history: persistent, searchable, per workstream
- API key management via settings page
- MCP-ready architecture: `src/lib/mcp.js` abstraction layer stubbed and documented for v2

### In scope (v2)
- Atlassian MCP integration: push Confluence pages directly from the app
- Atlassian MCP integration: create Jira tickets directly from the app
- MCP server configuration UI in Settings

### Out of scope (v1)
- Multi-user auth or backend
- Real-time collaboration

---

## 4. Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18 + Vite | Fast dev experience, clean build output, aligns with existing skills |
| Routing | React Router v6 | Standard, lightweight, no overengineering |
| Styling | Tailwind CSS v3 | Utility-first, consistent spacing and colour, no CSS file sprawl |
| State | React Context + useReducer | Sufficient for this scope; avoids Redux overhead for a single-user tool |
| Persistence | localStorage | No backend needed; survives sessions; trivial to migrate to a DB later |
| AI | Anthropic API (claude-sonnet-4-6) | Direct client-side calls; MCP server support built into the messages API |
| Dev IDE | Cursor | AI-accelerated development with MCP support for filesystem and GitHub |
| Deployment | Vercel (via GitHub) | Zero-config, autodeploy on push, free tier sufficient |
| Repo | GitHub | Source of truth; clean commit history as portfolio artifact |

---

## 5. Project structure

```
storypilot/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout.jsx           # App shell, nav, workstream switcher
│   │   ├── OutputTabs.jsx       # Stories / Jira / Confluence tab switcher
│   │   ├── CopyButton.jsx       # Copy to clipboard with confirmation
│   │   ├── PushButton.jsx       # MCP push action (v2, stubbed in v1)
│   │   └── StatusBadge.jsx      # Loading / error / success states
│   ├── pages/
│   │   ├── Generate.jsx         # Main generation view
│   │   ├── Context.jsx          # Workstream context configuration
│   │   ├── Coverage.jsx         # Coverage analysis view
│   │   ├── History.jsx          # Generation history view
│   │   └── Settings.jsx         # API key, MCP config, app preferences
│   ├── hooks/
│   │   ├── useStorage.js        # localStorage read/write abstraction
│   │   ├── useAnthropic.js      # API call handler, loading + error state
│   │   ├── useWorkstream.js     # Active workstream context accessor
│   │   └── useMCP.js            # MCP action handler (v2, stubbed in v1)
│   ├── lib/
│   │   ├── prompts.js           # All prompt builders
│   │   ├── anthropic.js         # Fetch wrapper for Anthropic API
│   │   ├── mcp.js               # MCP server config + tool call abstractions
│   │   └── storage.js           # localStorage keys and schema
│   ├── context/
│   │   └── AppContext.jsx       # Global state: workstreams, API key, MCP config
│   ├── App.jsx
│   └── main.jsx
├── .cursor/
│   └── mcp.json                 # Cursor MCP server config (filesystem + GitHub)
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
├── SPEC.md
└── README.md
```

The `.cursor/mcp.json` file is committed to the repo. It configures which MCP servers Cursor uses during development. Other developers cloning the repo get the same dev MCP setup automatically.

---

## 6. Data model

All data lives in localStorage. Keys are namespaced under `sp:` (to be updated when the app is named).

### Workstream
```json
{
  "id": "uuid",
  "name": "Customer Portal",
  "description": "Front-end portal consuming EDW feeds",
  "color": "#534AB7",
  "personas": "Residential customer, CSR, portal admin...",
  "terminology": "EDW = Enterprise Data Warehouse. CRM feed = Salesforce daily extract...",
  "exampleStory": "As a residential customer, I want to...",
  "definitionOfDone": "AC met, UI tested, PO sign-off, no open blockers",
  "confluenceTemplate": "## Overview\n## Goals\n## User stories\n...",
  "availableFeeds": "customer_profile, usage_summary, billing_history",
  "confluenceSpaceKey": "PORTAL",
  "confluenceParentPageId": "123456",
  "jiraProjectKey": "PORT",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

Note: `confluenceSpaceKey`, `confluenceParentPageId`, and `jiraProjectKey` are v2 fields. They are included in the schema now so the data model does not need a breaking change when MCP integration is added.

### Generation record (history)
```json
{
  "id": "uuid",
  "workstreamId": "uuid",
  "workstreamName": "Customer Portal",
  "input": "Raw BRD text pasted by user",
  "mode": "single | batch",
  "outputs": {
    "stories": "string",
    "jira": "string",
    "confluence": "string"
  },
  "batchItems": [
    {
      "requirement": "Detected requirement text",
      "outputs": { "stories": "", "jira": "", "confluence": "" }
    }
  ],
  "pushed": {
    "confluence": false,
    "jira": false
  },
  "createdAt": "ISO string"
}
```

The `pushed` object tracks whether a record has been pushed to Confluence or Jira via MCP. In v1 this is always false. In v2 it updates on successful push, so the history view can show what has already been sent.

### App settings
```json
{
  "apiKey": "sk-ant-...",
  "defaultOutputs": ["stories", "jira", "confluence"],
  "defaultStoryFormat": "standard | job | gherkin",
  "defaultIncludeAC": true,
  "defaultIncludeDoD": false,
  "mcpEnabled": false,
  "mcpAtlassianUrl": "",
  "mcpAtlassianToken": ""
}
```

---

## 7. Feature specifications

### 7.1 Workstream manager
- Pre-seeded with two workstreams on first load: **EDW** (teal) and **Customer Portal** (purple)
- Create new workstream: name, description, color picker, then configure context fields
- Edit / delete existing workstreams
- Workstream switcher is always visible in the nav — one click to switch context
- All generation, history, and coverage views are scoped to the active workstream
- Each workstream has optional Confluence space key, parent page ID, and Jira project key fields (v2 fields, visible but optional in v1)

### 7.2 Generator — single mode
- User pastes a requirement or BRD excerpt
- Selects outputs: stories, Jira, Confluence (any combination, default all three)
- Selects story format: As a / I want / So that | Job story | Gherkin
- Selects inclusions: AC only | AC + DoD | Stories only
- Selects epic/theme (optional free text)
- Workstream context is silently injected into the prompt
- Output renders in tabs: Stories | Jira | Confluence
- Each tab has a copy button and (v2) a push button
- Generation saved to history automatically

### 7.3 Generator — batch mode
- User toggles to batch mode and pastes a full BRD section
- First API call: splitter prompt returns a JSON array of individual requirements
- Each requirement shown as a card; user can deselect before generating
- Second API call per requirement: full generation with workstream context
- Results render per requirement, collapsible
- Full batch saved as one history record with per-requirement outputs

### 7.4 Coverage analysis
- User pastes BRD requirements list and existing stories
- Single API call with workstream context injected
- Output: Covered | Partially covered | Not covered
- Each item references the requirement and the story that addresses it
- "Generate gap stories" pre-fills the Generator in batch mode with uncovered items

### 7.5 History
- Lists all generations for the active workstream, newest first
- Each record shows: timestamp, input preview, output types, push status (v2)
- Click to expand: full input, all outputs, copy buttons, push buttons (v2)
- Search by input text
- Delete individual records or clear all

### 7.6 Settings
- API key input (masked, stored in localStorage)
- MCP configuration section: enable toggle, Atlassian MCP URL, token (v2, visible in v1 as "coming soon")
- Default output preferences
- Default story format preference
- Export all data as JSON
- Clear all data (with confirmation)

---

## 8. Prompt architecture

All prompts live in `src/lib/prompts.js` as pure functions. No prompt logic lives in components or hooks.

### Context injection pattern
```
Workstream: {name}
Personas: {personas}
Terminology: {terminology}
Match this story format exactly: {exampleStory}
Definition of done: {definitionOfDone}
{if availableFeeds}: EDW feeds available: {availableFeeds}
  Flag any story requiring a feed not in this list as DEPENDENCY RISK.
```

### Prompt functions
| Function | Purpose |
|---|---|
| `buildContext(ws)` | Assembles workstream context block |
| `storiesPrompt(input, ws, opts)` | Generates user stories |
| `jiraPrompt(input, ws, opts)` | Generates Jira ticket format |
| `confluencePrompt(input, ws, opts)` | Generates Confluence wiki markup |
| `splitterPrompt(input)` | Detects and extracts individual requirements as JSON array |
| `coveragePrompt(brd, stories, ws)` | Coverage gap analysis |

### Batch splitter prompt
Lightweight call that returns JSON only — low token cost:
```
Extract each individual requirement from the following BRD text.
Return ONLY a JSON array of strings, one per requirement.
Do not include preamble, explanation, or markdown.

BRD text:
{input}
```

---

## 9. MCP architecture

### 9.1 Development MCPs (Cursor)

Configure in `.cursor/mcp.json` at project root:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/storypilot"],
      "description": "Read and write project files directly from Cursor"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      },
      "description": "Create branches, commit, and open PRs from Cursor"
    }
  }
}
```

What this enables during development:
- Cursor reads `SPEC.md` directly — no copy-pasting the spec into context
- Cursor writes component files without you switching between windows
- Cursor creates feature branches and commits without leaving the IDE
- Every team member who clones the repo gets the same dev MCP setup

Note: the GitHub token goes in your local environment, not committed. Add `GITHUB_PERSONAL_ACCESS_TOKEN` to `.env.local` and reference it via `process.env` in the config, or set it as a system environment variable.

### 9.2 App MCP abstraction layer (v1 stub, v2 implementation)

`src/lib/mcp.js` is created in v1 as a documented stub. This means the architecture is MCP-aware from day one — v2 fills in the implementation without touching any other file.

```javascript
// src/lib/mcp.js

/**
 * MCP integration layer.
 * v1: all functions return { success: false, reason: 'MCP not configured' }
 * v2: functions pass mcp_servers config to the Anthropic API and handle responses
 */

export const MCP_SERVERS = {
  atlassian: {
    type: 'url',
    url: '', // populated from settings at runtime
    name: 'atlassian-mcp'
  }
}

/**
 * Push generated Confluence markup to a Confluence page.
 * @param {string} markup - Confluence wiki markup to push
 * @param {string} spaceKey - Target Confluence space
 * @param {string} parentPageId - Parent page ID
 * @param {string} title - Page title
 * @param {string} apiKey - Anthropic API key
 * @param {string} mcpUrl - Atlassian MCP server URL
 * @returns {Promise<{ success: boolean, pageUrl?: string, reason?: string }>}
 */
export async function pushToConfluence(markup, spaceKey, parentPageId, title, apiKey, mcpUrl) {
  // v1 stub
  return { success: false, reason: 'MCP integration coming in v2' }
}

/**
 * Create a Jira ticket from a generation output.
 * @param {object} ticket - { summary, description, acceptanceCriteria, labels, storyPoints }
 * @param {string} projectKey - Target Jira project key
 * @param {string} apiKey - Anthropic API key
 * @param {string} mcpUrl - Atlassian MCP server URL
 * @returns {Promise<{ success: boolean, ticketUrl?: string, reason?: string }>}
 */
export async function createJiraTicket(ticket, projectKey, apiKey, mcpUrl) {
  // v1 stub
  return { success: false, reason: 'MCP integration coming in v2' }
}
```

### 9.3 V2 MCP implementation pattern

When v2 is built, `pushToConfluence` will make an Anthropic API call with `mcp_servers` attached:

```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    mcp_servers: [
      {
        type: 'url',
        url: mcpUrl,
        name: 'atlassian-mcp'
      }
    ],
    messages: [
      {
        role: 'user',
        content: `Create a Confluence page in space ${spaceKey} under parent page ${parentPageId}
          with title "${title}" and the following wiki markup content:
          
          ${markup}`
      }
    ]
  })
})
```

Claude handles the tool call to the MCP server, creates the page, and returns the result including the page URL. The function extracts the URL from the response and returns it to the UI.

The `createJiraTicket` function follows the same pattern with a Jira-specific prompt.

### 9.4 MCP servers to use

| Server | Purpose | When |
|---|---|---|
| `@modelcontextprotocol/server-filesystem` | Read/write project files in Cursor | v1 dev setup |
| `@modelcontextprotocol/server-github` | Branch, commit, PR from Cursor | v1 dev setup |
| Atlassian MCP (Anthropic hosted) | Push to Confluence, create Jira tickets | v2 app feature |

The Atlassian MCP server is maintained by Anthropic/Atlassian. URL and auth token are configured in Settings and stored in localStorage under `sp:settings`.

---

## 10. API key handling

- On first load, if no key is stored, a modal prompts for it before anything else renders
- Key stored in localStorage under `sp:settings`
- Read from storage on each API call — never held in React state
- Settings page allows key update or deletion
- `.env.example` documents `VITE_ANTHROPIC_API_KEY` as an optional override for local dev
- When moving to a shared team key: update one constant in `src/lib/anthropic.js`

---

## 11. Deployment

### Local development
```bash
git clone https://github.com/{username}/storypilot
cd storypilot
npm install
cp .env.example .env.local   # Add API key for local dev
npm run dev
```

### Cursor MCP setup (first time)
```bash
# Install MCP servers globally
npx -y @modelcontextprotocol/server-filesystem
npx -y @modelcontextprotocol/server-github

# Set GitHub token in your environment
export GITHUB_PERSONAL_ACCESS_TOKEN=your-token

# .cursor/mcp.json is already in the repo — Cursor picks it up automatically
```

### Production (Vercel)
1. Push repo to GitHub
2. Import repo in Vercel dashboard
3. Framework preset: Vite (auto-detected)
4. No environment variables needed (API key entered by user at runtime)
5. Every push to `main` autodeploys

### Branch strategy
- `main` — production, protected
- `dev` — active development
- Feature branches off `dev`, PR to merge

---

## 12. Build order

Build in this sequence. Each step is independently deployable and testable before moving to the next.

| Step | What | Why this order |
|---|---|---|
| 1 | Scaffold Vite + React + Tailwind, deploy to Vercel | Live URL from day one; proves the pipeline works before any features |
| 2 | Configure Cursor MCPs (filesystem + GitHub) | Set up dev environment properly before writing real code |
| 3 | App shell: routing, nav, workstream switcher, AppContext | Everything else depends on this |
| 4 | Workstream manager: create, edit, delete, localStorage | Context storage must exist before generation |
| 5 | Generator: single mode, all three outputs | Core value; validates prompt architecture |
| 6 | History: save, list, expand, copy, search | Completes the single-mode workflow |
| 7 | Generator: batch mode (splitter + per-requirement generation) | Builds on single mode |
| 8 | Coverage analysis | Standalone feature, low dependency |
| 9 | Settings page + MCP config UI stub | Polish + prepares for v2 |
| 10 | README + repo cleanup | Portfolio presentation |
| 11 (v2) | Atlassian MCP: Confluence push | Implement `mcp.js` stubs |
| 12 (v2) | Atlassian MCP: Jira ticket creation | Same MCP server, second tool |

---

## 13. What this is not

This is a client-side tool with no backend:
- The Anthropic API key is visible to anyone who opens DevTools
- Acceptable for an internal team tool on a non-public URL
- Not acceptable if the URL is shared publicly
- If it grows beyond a small internal team, the next step is a simple Node proxy that holds the key server-side

---

## 14. Future v3 candidates

| Feature | Trigger |
|---|---|
| Backend + auth | Team grows beyond 3-4 people or URL needs to go public |
| Node proxy for API key | Any public-facing deployment |
| Prompt versioning | When output quality needs tracking across prompt iterations |
| Additional MCP servers | Linear, Notion, Slack — as the team's tooling evolves |
| Template library | When a third project type emerges with different enough patterns |

---

## 15. Portfolio notes

This project demonstrates:

- **Applied AI product thinking** — identified a real workflow problem and designed a structured solution, not a generic chatbot wrapper
- **MCP fluency** — used MCPs as a developer tool (Cursor) and designed MCP integration into the app architecture from v1
- **Prompt engineering** — context injection pattern, requirement splitting, structured output formatting, pure function prompt library
- **React architecture** — custom hooks, context + useReducer, clean separation of prompt logic from UI
- **Full-stack delivery** — from spec and decision record through to deployed production tool

The commit history should tell the build story. One commit per step in the build order above. Future employers or collaborators can read the repo and understand every decision made and why.