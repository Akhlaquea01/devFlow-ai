/**
 * Builds the PRD Generation prompt.
 *
 * @param storyContent    - Story text (only used as fallback if storyFilePath is not provided).
 * @param codebaseContext - Summarised tech-stack from the workspace analyser.
 * @param scope           - Implementation scope (fullstack / ui / backend / testing).
 * @param storyFilePath   - Absolute path to STORY.md on disk. When provided, the AI reads the
 *                          file directly — we do NOT embed the full story text in the prompt.
 * @param outputFilePath  - Absolute path where PRD.md will be saved. The IDE AI is instructed
 *                          to write its output to this file instead of printing it in chat.
 */
export function buildPrdPrompt(
  storyContent: string,
  codebaseContext: string,
  scope: string,
  storyFilePath?: string,
  outputFilePath?: string
): string {
  // Extract the story title from the Story section (if present)
  const titleMatch = storyContent.match(/## Title\s+(.+)/m);
  const storyTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Story';

  const storyReference = storyFilePath
    ? `**Story File (read directly from disk):** \`${storyFilePath}\`
> The IDE AI should open and read this file to get the full story context.
> Do NOT rely on an embedded copy — always read the latest version from the file.`
    : `**Full User Story / Requirement**:
\`\`\`markdown
${storyContent.trim()}
\`\`\``;

  const outputSection = outputFilePath
    ? `
---

## 🤖 IDE AI Instructions

You are running inside an IDE (VS Code with GitHub Copilot, Cursor, or similar).
The output of this prompt **must be saved to**:
\`\`\`
${outputFilePath}
\`\`\`

Rules:
1. **Read** the story from \`${storyFilePath || 'the story file provided'}\` before generating the PRD.
2. **Write** the complete PRD directly to \`${outputFilePath}\` — do not print the whole document in chat.
3. Preserve all section numbers and names exactly as specified below.
4. If PRD.md already exists, **update only sections that have changed** — do not wipe progress notes or annotations.
5. After saving, confirm: "✅ PRD.md updated at \`${outputFilePath}\`"
`
    : '';

  return `You are a **Senior Product Manager** acting as my peer collaborator. Help me create a comprehensive Product Requirements Document.

**Story Title**: ${storyTitle}

${storyReference}

**Implementation Scope**: ${scope}

**Codebase Context**:
${codebaseContext}

---

## Context

I need a production-grade PRD that bridges business intent with technical execution. This document will be the single source of truth for the entire development lifecycle — reviewed by stakeholders, used by designers, and referenced by engineers.

---

## Generate the Following Sections in Markdown

### 1. Title
Feature: ${storyTitle}

### 2. Scope
${scope}

### 3. Context
<Summarize the codebase context and architectural alignment>

### 4. Problem Analysis
- What specific problem does this solve?
- What is the current user journey (before this feature)?
- Cost of inaction — what happens if we don't build this?

### 5. Functional Requirements
For each feature, provide:
- **ID**: FR-001, FR-002, etc.
- **Title**: Short feature name
- **Description**: What it does
- **User Workflow**: Step-by-step user interaction
- **Priority**: P0 (must-have) / P1 (should-have) / P2 (nice-to-have)

### 6. Acceptance Criteria
<Extract and refine Acceptance Criteria from the Story, formatted as Given/When/Then>

### 7. Non-Functional Requirements
- Performance targets (latency, throughput)
- Security requirements
- Accessibility requirements (WCAG level)
- Reliability/availability targets

### 8. User Experience Requirements
- Information architecture and navigation flow
- Key screen descriptions with interaction patterns

### 9. Success Metrics
<Extract and refine Success Metrics from the Story>

---

## Output Rules

- **STRICT ENFORCEMENT**: You MUST output the sections exactly as named above (Title, Scope, Context, Problem Analysis, Functional Requirements, Acceptance Criteria, Non-Functional Requirements, User Experience Requirements, Success Metrics). Do not rename them.
- Use tables for structured data (requirements, metrics, priorities).
- Every requirement must have a unique ID for traceability.
- Keep language precise — avoid "should be nice" or "make it good".
- This PRD will be the direct input for TDS creation.

---

**Output Format**: Well-structured Markdown PRD ready for stakeholder review and engineering handoff.${outputSection}`;
}
