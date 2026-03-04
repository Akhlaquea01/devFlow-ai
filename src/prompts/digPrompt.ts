export function buildDigPrompt(tdsPath: string, codebaseContext: string): string {
  return `You are a **Staff-Level Developer** acting as my peer collaborator. Create a step-by-step Development Implementation Guide based on the attached TDS.

@${tdsPath}

**Codebase Context**:
${codebaseContext}

---

## Context

The TDS (attached above) defines the complete technical design. Your job is to convert it into an **actionable, sequential implementation plan** that I can follow commit-by-commit during development. Each step must be atomic, testable, and traceable to a TDS section.

---

## Generate the Following Sections

### 1. TDS → Implementation Task Mapping
| TDS Section | Implementation Task | Files Affected | Estimated Effort | Order |
|---|---|---|---|---|
| §2.1 | Set up project scaffold | 5 new files | 30 min | 1 |

### 2. Pre-Implementation Setup
- [ ] Branch naming convention and creation
- [ ] Environment setup (env vars, secrets, tools)
- [ ] Required dependencies to install
- [ ] Development server / local tooling configuration
- [ ] Pre-commit hooks and linting setup

### 3. Implementation Roadmap

\\\`\\\`\\\`mermaid
gantt
    title Implementation Phases
    section Phase 1: Foundation
    Task 1 :a1, 2026-03-05, 2d
    section Phase 2: Core
    Task 2 :a2, after a1, 3d
\\\`\\\`\\\`

Identify:
- What **must** be sequential (dependency chain)
- What **can** be parallelized
- Critical path and potential blockers
- Major milestone checkpoints

### 4. File & Folder Structure
\\\`\\\`\\\`
project-root/
├── src/
│   ├── extension.ts          # Entry point
│   ├── commands/              # Command handlers
│   ├── providers/             # Tree views, webviews
│   ├── services/              # Business logic
│   ├── models/                # Data models
│   ├── utils/                 # Shared utilities
│   └── test/                  # Test files
├── webview/                   # Webview UI source
├── resources/                 # Icons, assets
└── package.json               # Extension manifest
\\\`\\\`\\\`

For each new file, specify:
- File path and name
- Purpose and responsibility
- Exports (functions, classes, interfaces)
- Which TDS component it implements

### 5. Step-by-Step Implementation Plan

For **each step**, provide:

\\\`\\\`\\\`
#### Step N: [Task Title]
- **TDS Reference**: §X.Y
- **PRD Requirement**: FR-XXX
- **Action**: What to do (create / modify / delete)
- **Files**:
  - \\\`path/to/file.ts\\\` — description of changes
- **Implementation Details**:
  - Key logic to implement
  - Function signatures with types
  - Important patterns to follow
- **Verification**:
  - [ ] How to verify this step works
  - [ ] What tests to run
- **Commit Message**: \\\`feat(scope): description\\\`
\\\`\\\`\\\`

### 6. Database Implementation Steps
In order:
1. Create migration files
2. Define schemas/models
3. Add seed data
4. Write repository/DAO layer
5. Verify with test queries

### 7. API Implementation Steps
For each endpoint from TDS:
1. Define route
2. Implement controller/handler
3. Add request validation
4. Implement service layer logic
5. Add error handling and response formatting
6. Write API tests
7. Update API documentation

### 8. Frontend Implementation Steps
1. Set up component structure
2. Implement base/shared components first
3. Build feature-specific components
4. Implement state management
5. Connect to APIs
6. Add loading, error, and empty states
7. Responsive and accessibility pass
8. Visual QA

### 9. Integration Implementation Steps
For each third-party service:
1. Create service client/wrapper
2. Implement authentication
3. Build API call methods
4. Add retry and error handling
5. Create mock/stub for testing
6. Integration test with real service

### 10. Testing Implementation
For each step in §5, define:
- Unit tests to write (with test names)
- Integration tests needed
- Manual verification checklist
- Edge cases to cover

### 11. Development Checklist
Create the master checklist in this exact format:

\\\`\\\`\\\`
## Phase 1: Foundation
- [ ] Step 1: [Task] → TDS §X.Y → FR-XXX
- [ ] Step 2: [Task] → TDS §X.Y → FR-XXX
  - [ ] Sub-step 2a: [Detail]
  - [ ] Sub-step 2b: [Detail]

## Phase 2: Core Features
- [ ] Step 3: [Task] → TDS §X.Y → FR-XXX
...

## Phase 3: Integration & Testing
...

## Phase 4: Polish & Release
...
\\\`\\\`\\\`

### 12. Common Pitfalls & Best Practices
- Anti-patterns to avoid for this specific implementation
- Performance gotchas
- Security checklist items
- Code review focus areas
- Known limitations and workarounds

---

## Output Rules

- Every step must be **atomic** — completable and verifiable independently
- Every step must trace back to TDS and PRD
- Include **exact file paths**, function names, and type signatures
- Steps should follow the TDS architecture — don't deviate
- Provide commit messages for each step (conventional commits format)
- Flag blockers with \\\`🚫 BLOCKED BY\\\` markers
- Flag decisions with \\\`🔴 DECISION NEEDED\\\` markers
- Estimate time for each step (in minutes or hours)
- This DIG will be the direct input for DEV implementation

---

**Output Format**: Numbered, actionable checklist with full implementation details, ready to start coding immediately.`;
}

