/**
 * Builds the Story Generation prompt.
 *
 * @param requirement     - Raw text requirement (used when no storyFilePath is provided).
 * @param codebaseContext - Summarised tech-stack from the workspace analyser.
 * @param storyId         - Optional Jira-style ticket ID.
 * @param outputFilePath  - Absolute path where STORY.md will be saved (passed to the IDE AI
 *                          so it can update the file directly instead of just printing output).
 * @param storyFilePath   - If the user picked an existing .md file as input, pass its path here
 *                          so the AI reads it from the file system rather than having it embedded.
 */
export function buildStoryPrompt(
  requirement: string,
  codebaseContext?: string,
  storyId?: string,
  outputFilePath?: string,
  storyFilePath?: string
): string {
  const projectSection = codebaseContext
    ? `Detected Tech Stack:\n${codebaseContext}`
    : 'Detected Tech Stack: Not provided\nFramework: Not provided\nLanguage: Not provided\nArchitecture: Not provided';

  const id = storyId || `DEVFLOW-UX-${Date.now()}`;

  const requirementSection = storyFilePath
    ? `Source type: Existing MD file\nRequirement file: \`${storyFilePath}\`\n(Read the full content of that file to understand the requirement.)`
    : `Source type: Text / Prompt\nRequirement text:\n${requirement}`;

  const outputSection = outputFilePath
    ? `
---

## 🤖 IDE AI Instructions

You are running inside an IDE (VS Code with GitHub Copilot, Cursor, or similar).
The output of this prompt **must be saved to**:
\`\`\`
${outputFilePath}
\`\`\`

Rules for updating the file:
1. **Do NOT** print the full markdown in the chat. Instead, **edit the file directly** at the path above.
2. Preserve all section headers exactly as specified in the template below.
3. If the file already exists, **update only the sections that have changed** — do not wipe unrelated content.
4. After writing, confirm: "✅ STORY.md updated at \`${outputFilePath}\`"
`
    : '';

  return `You are an expert Agile Product Manager and Business Analyst.
Your task is to generate a comprehensive Agile User Story based on the provided input.
The user might have provided a simple prompt, a copy-pasted requirement, a path to an existing .md file, context files, or a Jira ticket ID.

Analyze the input and generate a structured User Story in Markdown (.md) format.

**IMPORTANT:** You MUST strictly follow the exact Markdown structure below. Do not omit any sections.

# Story

## Title
<clear feature title>

## Project
<project name or inferred from context>

## Description
<high level explanation of requirement>

## User Story
**As a** <user>
**I want** <feature>
**So that** <benefit>

## Acceptance Criteria
- <AC-1>
- <AC-2>
- <AC-3>

## Inputs
${requirementSection}
Attached files: <list if any>
Figma links: <list if any>

## Context
${projectSection}

## Scope
<Fullstack | UI | Backend | Testing - infer from requirement if possible>

## Success Metrics
- <metric 1>
- <metric 2>

## Dependencies
- <dependency 1>
- <dependency 2>
${outputSection}`;
}
