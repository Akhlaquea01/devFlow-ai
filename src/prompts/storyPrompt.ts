export function buildStoryPrompt(requirement: string): string {
  return `You are an expert Agile Product Manager and Business Analyst.
Your task is to generate a comprehensive Agile User Story based on the provided input.
The user might have provided a simple prompt, a copy-pasted requirement, context files, or a Jira ticket ID (which you should fetch using MCP tools if available).

Analyze the input and generate a structured User Story in Markdown (.md) format.

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

## Provided Input / Context
${requirement}
`;
}
