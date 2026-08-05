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
  return `You are a product analyst writing user stories as Jira-ready tickets for a software team.
 
${buildContext(workstream)}
 
Generation options:
${buildOptsBlock(opts)}
 
Requirement or BRD excerpt:
${input}
 
First, determine how many distinct stories this requirement breaks down into. Some
requirements are a single story; many are not — do not force everything into one
story if the requirement genuinely covers multiple pieces of functionality.
 
For EACH distinct story, output:
- Summary (concise ticket title)
- Description, written in the story format specified in the generation options,
  following the style of the example story in the workstream context
${opts.include !== 'stories-only' ? '- Acceptance criteria as a checklist' : ''}
${opts.include === 'ac+dod' ? '- Definition of done section' : ''}
${opts.epic?.trim() ? `- Label or reference to epic: ${opts.epic.trim()}` : ''}
 
Separate each story with a line of dashes (---) between them so they can be told
apart when pasted into Jira individually.
 
Write all stories strictly from the business user perspective.
Do not include any technical implementation details such as:
- Primary keys, foreign keys, or data types
- Table names, schema design, or dimension/fact terminology
- ETL pipeline logic or data load processes
- Nullability, indexing, or database constraints
 
Focus only on what the business user needs to see, filter, compare, or analyze in their reports.
The how is for the engineering team to determine.
 
Use plain text suitable for pasting directly into Jira. Return only the ticket content —
no preamble or explanation.`
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

export function coveragePrompt(brd, stories, workstream) {
  const ctx = buildContext(workstream)
  return `You are a senior product manager doing a requirements coverage analysis.

${ctx}

BRD Requirements:
${brd}

Existing User Stories:
${stories}

Analyse coverage and output three clearly labelled sections:

COVERED
List each requirement that is clearly and fully addressed by an existing story. Reference the requirement and the story that covers it.

PARTIALLY COVERED
List each requirement that is touched by an existing story but has gaps -- missing edge cases, incomplete AC, or only partially addressed. Be specific about what is missing.

NOT COVERED
List each requirement with no corresponding story. These are gaps that need new stories written.

End with a short prioritised list of recommended stories to write next, based on the gaps identified.

Be specific. Reference requirement numbers where they exist. Do not be vague.`
}

export function analysisPrompt(rawInput, workstream) {
  const contextBlock = workstream ? buildContext(workstream) : "";
 
  return `${contextBlock}
 
You are extracting structured, numbered business requirements from raw source content.
The source may be messy: pasted Excel data, report descriptions, stakeholder notes, meeting
notes, or a mix. Your job is to identify every discrete requirement and return it as
structured data.
 
RULES:
- Extract every distinct requirement, rule, or piece of functionality described in the source.
- Rewrite each as a single clear sentence in the requirement field. Do not copy the raw
  text verbatim if it is a fragment, table row, or notes — turn it into a complete requirement
  statement. If the source text is already a clean requirement sentence, keep it close to
  the original wording.
- Assign a category to every requirement. Infer categories from the content itself
  (e.g. by report tab, feature area, or workflow stage mentioned in the source).
  Do not use a single catch-all category unless the source genuinely only covers one area.
  Reuse the same category label consistently across requirements that belong together.
- Include a short sourceExcerpt for each requirement: the original snippet (max ~15 words)
  that this requirement was drawn from, so it can be traced back to the source.
- Number requirement ids sequentially as REQ-01, REQ-02, etc., in the order they appear
  in the source, regardless of category.
- If the source contains something that is clearly not a requirement (a comment, a question,
  a status note), do not include it. If unsure, include it and let the user decide.
 
Return ONLY a JSON array. No markdown code fences, no prose before or after, no explanation.
If the source contains no extractable requirements, return an empty array: []
 
Example shape:
[
  {
    "id": "REQ-01",
    "requirement": "The report must show mature location status based on lease start date.",
    "category": "Mature Locations",
    "sourceExcerpt": "mature loc def - based on lease start??"
  }
]
 
SOURCE CONTENT TO ANALYZE:
"""
${rawInput}
"""`;
}