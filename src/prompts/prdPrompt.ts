export function buildPrdPrompt(storyContent: string, codebaseContext: string, scope: string): string {
  // Extract the story title from the first # heading (if present)
  const titleMatch = storyContent.match(/^#\s+(.+)/m);
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

## Generate the Following Sections

### 1. Executive Summary
- One-paragraph overview of what we're building and why
- The core value proposition in one sentence
- Target release timeline

### 2. User Personas & Stories
- Define 2–3 primary user personas with roles, goals, and pain points
- Write user stories in **As a / I want / So that** format
- Map each story to a persona
- Include edge-case user scenarios

### 3. Problem Analysis
- What specific problem does this solve?
- What is the current user journey (before this feature)?
- What data or evidence supports this problem?
- Cost of inaction — what happens if we don't build this?

### 4. Functional Requirements
For each feature, provide:
- **ID**: FR-001, FR-002, etc.
- **Title**: Short feature name
- **Description**: What it does
- **User Workflow**: Step-by-step user interaction
- **Acceptance Criteria**: Testable conditions (Given/When/Then format)
- **Priority**: P0 (must-have) / P1 (should-have) / P2 (nice-to-have)
- **Dependencies**: Other features or systems this depends on

### 5. Non-Functional Requirements
- Performance targets (latency, throughput)
- Security requirements
- Accessibility requirements (WCAG level)
- Scalability expectations
- Reliability/availability targets
- Browser/platform compatibility

### 6. User Experience Requirements
- Information architecture and navigation flow
- Key screen descriptions with interaction patterns
- Error states and empty states
- Loading states and optimistic UI patterns
- Responsive behavior across device sizes
- Accessibility interaction patterns

### 7. Business Context & KPIs
- Business objective alignment
- Success metrics with specific targets
- How we will measure each metric
- Baseline values for comparison
- Reporting cadence

### 8. Scope Definition
- **In Scope**: What's included in this release
- **Out of Scope**: What's explicitly excluded
- **Future Considerations**: What might come in later iterations

### 9. Constraints & Assumptions
- Technical constraints (stack, infrastructure, budget)
- Business constraints (timeline, resources, compliance)
- Key assumptions that must hold true
- Risks if assumptions are violated

### 10. Dependencies & Integrations
- Internal team dependencies
- External system dependencies
- Third-party service dependencies
- Data dependencies

### 11. Release Strategy
- Phased rollout plan (MVP → V1 → V2)
- Feature flags for gradual rollout
- Rollback criteria and plan
- Communication plan for stakeholders

---

## Output Rules

- Use tables for structured data (requirements, metrics, priorities)
- Include diagrams where helpful (user flows, system context)
- Every requirement must have a unique ID for traceability
- Write acceptance criteria in Given/When/Then format
- Flag any ambiguities with \\\`⚠️ NEEDS CLARIFICATION\\\` markers
- Keep language precise — avoid "should be nice" or "make it good"
- This PRD will be the direct input for TDS creation

---

**Output Format**: Well-structured Markdown PRD ready for stakeholder review and engineering handoff.`;
}

