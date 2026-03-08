export function buildStoryPrompt(requirement: string, codebaseContext?: string): string {
  const projectSection = codebaseContext
    ? `\n## Project Context\nThe following details describe the existing codebase and project setup. Use this to tailor the story to the actual tech stack and project structure:\n\n${codebaseContext}\n`
    : '';

  return `You are an expert Agile Product Manager and Business Analyst.
Your task is to generate a comprehensive Agile User Story based on the provided input.
The user might have provided a simple prompt, a copy-pasted requirement, context files, or a Jira ticket ID (which you should fetch using MCP tools if available).

Analyze the input and generate a structured User Story in Markdown (.md) format.
${projectSection}
Please output the result clearly using the following structure:

# [Story Title]

## User Story
**As a** [type of user]
**I want** [some goal]
**So that** [some reason]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes & Assumptions
- Note 1

## Technical Considerations
- Consider the existing tech stack and frameworks listed in Project Context above.
- Acceptance criteria should align with the detected languages / frameworks where relevant.

## Provided Input / Context
${requirement}
`;
}
