export function buildPrdPrompt(storyContent: string, codebaseContext: string, scope: string): string {
  // Extract the story title from the Story section (if present)
  const titleMatch = storyContent.match(/## Title\s+(.+)/m);
  const storyTitle = titleMatch ? titleMatch[1].trim() : 'Untitled Story';

  return `You are a **Senior Product Manager** acting as my peer collaborator. Help me create a comprehensive Product Requirements Document.

**Story Title**: ${storyTitle}

**Full User Story / Requirement**:
\`\`\`markdown
${storyContent.trim()}
\`\`\`

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

**Output Format**: Well-structured Markdown PRD ready for stakeholder review and engineering handoff.`;
}
