const STORY_FORMAT_LABELS = {
  standard: 'As a / I want / So that',
  job: 'Job story',
  gherkin: 'Gherkin',
}

const INCLUDE_LABELS = {
  ac: 'Acceptance criteria only',
  'ac+dod': 'Acceptance criteria and Definition of done',
  'stories-only': 'Stories only — no acceptance criteria or DoD',
}

export function buildContext(workstream) {
  const lines = [
    `Workstream: ${workstream.name}`,
    `Personas: ${workstream.personas}`,
    `Terminology: ${workstream.terminology}`,
    `Match this story format exactly: ${workstream.exampleStory}`,
    `Definition of done: ${workstream.definitionOfDone}`,
  ]

  if (workstream.availableFeeds?.trim()) {
    lines.push(
      `EDW feeds available: ${workstream.availableFeeds}`,
      'Flag any story requiring a feed not in this list as DEPENDENCY RISK.'
    )
  }

  return lines.join('\n')
}

function buildOptsBlock(opts) {
  const lines = [
    `Story format: ${STORY_FORMAT_LABELS[opts.storyFormat] ?? opts.storyFormat}`,
    `Include: ${INCLUDE_LABELS[opts.include] ?? opts.include}`,
  ]
  if (opts.epic?.trim()) {
    lines.push(`Epic / theme: ${opts.epic.trim()}`)
  }
  return lines.join('\n')
}

export function storiesPrompt(input, workstream, opts) {
  return `You are a product analyst writing user stories for a software team.

${buildContext(workstream)}

Generation options:
${buildOptsBlock(opts)}

Requirement or BRD excerpt:
${input}

Write clear, actionable user stories for the requirement above.
Use the story format specified in the generation options.
Follow the style of the example story in the workstream context.
${opts.include === 'stories-only' ? 'Do not include acceptance criteria or definition of done.' : ''}
${opts.include === 'ac' ? 'Include acceptance criteria for each story. Do not include definition of done.' : ''}
${opts.include === 'ac+dod' ? 'Include acceptance criteria and definition of done for each story.' : ''}
Return only the stories — no preamble or explanation.`
}

export function jiraPrompt(input, workstream, opts) {
  return `You are a product analyst creating Jira tickets for a software team.

${buildContext(workstream)}

Generation options:
${buildOptsBlock(opts)}

Requirement or BRD excerpt:
${input}

Create a Jira ticket for the requirement above. Include:
- Summary (concise title)
- Description
- Acceptance criteria as a checklist
${opts.include === 'ac+dod' ? '- Definition of done section' : ''}
${opts.epic?.trim() ? `- Label or reference to epic: ${opts.epic.trim()}` : ''}

Use plain text suitable for pasting into Jira. Return only the ticket content — no preamble.

Write all stories strictly from the business user perspective.
Do not include any technical implementation details such as:
- Primary keys, foreign keys, or data types
- Table names, schema design, or dimension/fact terminology  
- ETL pipeline logic or data load processes
- Nullability, indexing, or database constraints

Focus only on what the business user needs to see, filter, compare, or analyze in their reports.
The how is for the engineering team to determine.`
}

export function confluencePrompt(input, workstream, opts) {
  return `You are a product analyst writing Confluence documentation for a software team.

${buildContext(workstream)}

Confluence template structure to follow:
${workstream.confluenceTemplate}

Generation options:
${buildOptsBlock(opts)}

Requirement or BRD excerpt:
${input}

Write a Confluence page in wiki markup for the requirement above.
Follow the template structure provided.
Include user stories in the appropriate section.
${opts.include !== 'stories-only' ? 'Include acceptance criteria where relevant.' : ''}
Return only the Confluence wiki markup — no preamble or explanation.`
}
