# DevFlow AI

> **Turn any requirement into production-ready AI prompts in minutes — right inside VS Code.**

[![Version](https://img.shields.io/badge/version-0.1.3-blue.svg)](https://marketplace.visualstudio.com/items?itemName=MasTi.masTiFlow)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.85.0-brightgreen.svg)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Akhlaquea01%2FdevFlow--ai-lightgrey.svg)](https://github.com/Akhlaquea01/devFlow-ai)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Akhlaquea01/devFlow-ai/pulls)

Created by **[Akhlaque](https://github.com/Akhlaquea01)** — open source and open for contributions 🚀

---

## What is DevFlow AI?

DevFlow AI is a **prompt engineering workbench** for VS Code. It does **not** call any AI API directly — instead, it generates structured, context-rich Markdown prompt documents and feeds them into your AI tool of choice (GitHub Copilot Chat, Cursor, ChatGPT, etc.).

Give it a requirement — a sentence, a Jira ticket, a PDF spec, or a Figma screenshot URL — and it walks you through a **5-step wizard** that produces professional prompt artifacts:

| Step | Artifact | Purpose |
|------|----------|---------|
| 1    | **STORY** | Agile User Story structured for AI consumption |
| 2    | **PRD**   | Product Requirements Document (11 sections) |
| 3    | **TDS**   | Technical Design Specification (architecture, API, DB) |
| 4    | **DIG**   | Development Implementation Guide (step-by-step plan) |
| 5    | **DEV**   | Pair-programming prompt for AI-assisted coding |

Each artifact is saved to your workspace's `.devflow/` directory and automatically opened in VS Code Chat.

---

## How It Works

```
Your Requirement
     │
     ▼
┌──────────────┐
│  1. STORY    │ ← Structures your raw requirement as an Agile User Story
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  2. PRD      │ ← Expands into full Product Requirements (uses codebase context)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  3. TDS      │ ← Creates Technical Design Specification from PRD
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  4. DIG      │ ← Generates step-by-step Development Implementation Guide
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  5. DEV      │ ← Pair-programming prompt for implementation with AI
└──────────────┘
       │
       ▼
  Your AI Tool (Copilot Chat, Cursor, ChatGPT…)
```

---

## Features

- 🧠 **Codebase-aware prompts** — Automatically detects your tech stack (TypeScript, React, Python, etc.), frameworks, package manager, and project structure. Every generated prompt includes this context so your AI produces code that fits your project.

- 📥 **Flexible requirement inputs** — Enter requirements as:
  - Plain text / prompt
  - Clipboard paste
  - Jira ticket ID
  - Attached files: `.pdf`, `.docx`, `.txt`, `.ts`, `.json`, etc.
  - Figma or screenshot URLs

- 🔗 **5-step sequential wizard** — Each step uses the output of the previous one as input. The chain ensures traceability from business requirement all the way to implementation code.

- 📋 **Clipboard-first workflow** — Every generated prompt is automatically copied to clipboard and opened in VS Code Chat for immediate use.

- 🗂️ **Persistent `.devflow/` artifacts** — All generated prompts are saved as Markdown files so you can version-control them, share with teammates, or revisit later.

- 🔑 **No API keys required** — DevFlow AI is a pure prompt generator. Zero configuration, zero cost.

---

## Installation

1. Open **VS Code**
2. Go to **Extensions** (`Ctrl+Shift+X`)
3. Search for **`DevFlow AI`**
4. Click **Install**

Or install via the command line:

```bash
code --install-extension MasTi.masTiFlow
```

---

## Quick Start

### Option A: Activity Bar

1. Click the **DevFlow AI** icon (🚀) in the Activity Bar to open the sidebar.
2. In **Step 1 – Generate Story Prompt**, enter your requirement.
3. Click **🚀 Generate Story Prompt**.
4. The Story prompt opens in VS Code Chat. Paste the AI response into **Step 2's** Story file path.
5. Continue through Steps 2–5 sequentially.

### Option B: Keyboard Shortcut

Press `Ctrl+Shift+D` (Mac: `Cmd+Shift+D`) to open the DevFlow AI sidebar instantly.

### Option C: Command Palette

Open the Command Palette (`Ctrl+Shift+P`) and run:
- `DevFlow: Start Workflow`
- `DevFlow: Analyze Codebase`
- `DevFlow: Show Help`

---

## Step-by-Step Guide

### Step 1 — Generate Story Prompt

| Field | Description |
|-------|-------------|
| **Input Source** | Choose: Text/Prompt, Clipboard, Jira Issue, or **Browse MD File** |
| **Requirement** | Describe what you want to build |
| **Browse MD File** | Pick an existing `.md` file — the AI reads it directly, no copy-paste needed |
| **Context Files** | Attach `.pdf`, `.docx`, or any code file for additional context |
| **Figma / Image URL** | Add a Figma link or screenshot URL |

Click **🚀 Generate Story Prompt** → The prompt is sent to Chat and the STORY.md is saved to `.devflow/`.

---

### Step 2 — Generate PRD Prompt

1. The **Story file** from Step 1 is auto-filled.
2. Choose your **implementation scope**: Full Stack / UI Only / Backend / Testing.
3. Click **🚀 Generate PRD Prompt**.

The PRD prompt includes 11 sections: Executive Summary, User Personas, Problem Analysis, Functional Requirements, Non-Functional Requirements, UX Requirements, KPIs, Scope Definition, Constraints, Dependencies, and Release Strategy.

---

### Step 3 — Generate TDS Prompt

1. Select (or browse) the **PRD file** from Step 2.
2. Click **🚀 Generate TDS Prompt**.

The TDS prompt covers: architecture diagrams (Mermaid), database design, API design, component design, security, performance, testing strategy, and risk assessment.

---

### Step 4 — Generate DIG Prompt

1. Select the **TDS file** from Step 3.
2. Click **🚀 Generate DIG Prompt**.

The DIG prompt produces a step-by-step development implementation guide with atomic Git commits, file structure, and a DIG checklist.

---

### Step 5 — Generate DEV Prompt

1. Select the **DIG file** from Step 4.
2. Click **🚀 Generate DEV Prompt**.

The DEV prompt sets up a pair-programming session with your AI tool, strictly following the DIG plan with code quality standards, error handling requirements, and testing discipline built in.

---

## Configuration

Open the VS Code Settings (`Ctrl+,`) and search for **DevFlow**:

| Setting | Default | Options | Description |
|---------|---------|---------|-------------|
| `devflow.defaultScope` | `fullstack` | `ui`, `backend`, `fullstack`, `testing`, `infrastructure` | Default implementation scope for PRD generation |

---

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `DevFlow: Start Workflow` | `Ctrl+Shift+D` | Opens the DevFlow AI sidebar |
| `DevFlow: Analyze Codebase` | — | Analyzes your workspace and shows a tech stack summary |
| `DevFlow: Show Help` | — | Opens the help document in VS Code |

---

## Output Files

All artifacts are saved to the `.devflow/` directory at your workspace root:

```
your-project/
└── .devflow/
    ├── STORY.md    ← Step 1 output
    ├── PRD.md      ← Step 2 output (AI-generated response you paste back)
    ├── TDS.md      ← Step 3 output
    ├── DIG.md      ← Step 4 output
    └── DEV.md      ← Step 5 output
```

> **Tip:** Commit your `.devflow/` directory to version control to track the full history of your requirement evolution.

---

## Use Cases

- **Solo developers** who want to think through a feature before coding
- **Teams** who want consistent, traceable prompt artifacts across engineers
- **Tech leads** generating architectural docs from Jira tickets
- **AI-assisted development** teams using Copilot Chat, Cursor, or similar tools
- **Product managers** creating structured PRDs from rough ideas

---

## Example Workflow

```
Requirement: "Add a dark mode toggle to the settings page"
    │
    ├─ Step 1 → STORY.md:
    │   As a user, I want a dark mode toggle in settings
    │   so that I can reduce eye strain in low-light environments.
    │
    ├─ Step 2 → PRD.md (AI-generated):
    │   - FR-001: Dark Mode Toggle (P0)
    │   - FR-002: System Preference Sync (P1)
    │   - Performance: <16ms theme switch
    │   - Accessibility: WCAG 2.1 AA
    │
    ├─ Step 3 → TDS.md (AI-generated):
    │   - ThemeService (singleton), localStorage persistence
    │   - CSS custom properties strategy
    │   - React Context for theme propagation
    │
    ├─ Step 4 → DIG.md (AI-generated):
    │   Step 1: Create ThemeContext
    │   Step 2: Add ToggleButton component
    │   Step 3: Wire up Settings page
    │   Step 4: Write unit tests
    │
    └─ Step 5 → DEV Prompt:
        Pair-programming session following DIG step by step.
```

---

## Supported File Attachments

| Extension | Parsing |
|-----------|---------|
| `.pdf` | Full text extraction via `pdf-parse` |
| `.docx` | Text extraction via `mammoth` |
| `.txt`, `.md`, `.ts`, `.js`, `.json`, `.yml`, etc. | Raw UTF-8 read |

---

## FAQ

**Q: Does DevFlow AI send my code or requirements to any server?**
A: No. DevFlow AI runs entirely locally. It only reads your files and generates text prompts. No network requests are made.

**Q: Do I need a GitHub Copilot subscription?**
A: No. DevFlow AI generates prompts that you can paste into any AI tool — Copilot Chat, ChatGPT, Claude, Cursor, or any other.

**Q: Can I use my own prompt templates?**
A: Template customization support is planned. Watch the [GitHub repo](https://github.com/Akhlaquea01/devFlow-ai) for updates.

**Q: Does it support Jira integration?**
A: Yes, partially. Enter a Jira ticket ID as the input source. Full Jira API integration via MCP tools is on the roadmap.

**Q: What languages and frameworks are detected?**
A: TypeScript, JavaScript, Python, Java, Go, Rust, C#; React, Angular, Vue, Next.js, Express, NestJS, Fastify — with more planned.

---

## Roadmap

- [ ] Jira MCP integration (live ticket fetching)
- [ ] Custom prompt templates via `.devflow/templates/`
- [ ] Workflow history log (`session.json`)
- [ ] Output diff view before overwriting existing `.devflow/*.md` files
- [ ] Step progress indicator in sidebar
- [ ] Prompt preview pane (inline, collapsible)
- [ ] Infrastructure scope for DevOps/IaC prompts

---

## Contributing

This project is **open source and open for contributions**! Whether it's a bug fix, a new feature, improved prompts, or better documentation — all PRs are welcome.

👉 **Repository:** [github.com/Akhlaquea01/devFlow-ai](https://github.com/Akhlaquea01/devFlow-ai)

### Ways to contribute
- 🐛 **Report bugs** — [Open an issue](https://github.com/Akhlaquea01/devFlow-ai/issues)
- 💡 **Suggest features** — [Start a discussion](https://github.com/Akhlaquea01/devFlow-ai/discussions)
- 🔧 **Submit a PR** — Fork → branch → code → PR
- 📝 **Improve prompts** — Better STORY / PRD / TDS / DIG / DEV templates are always appreciated
- 📖 **Improve docs** — Fix typos, add examples, translate

### Local development
```bash
# Clone the repo
git clone https://github.com/Akhlaquea01/devFlow-ai.git
cd devFlow-ai

# Install dependencies
npm install

# Start watching for changes
npm run watch

# Press F5 in VS Code to launch the Extension Development Host
```

Please follow the existing code style and add a brief description to your PR. All contributions will be credited. ✨

---

## Release Notes

### 0.1.3
- Browse MD File input for Story step — pass a file path instead of copy-pasting
- All prompts now reference input file paths directly (no content embedding)
- IDE AI Instructions block in every prompt — AI updates `.devflow/*.md` files automatically
- Enhanced DEV prompt rewritten as a full coding agent (session log, DIG step tracking, targeted edits)

### 0.1.2
- Step-by-step 5-stage wizard (Story → PRD → TDS → DIG → DEV)
- PDF and DOCX file attachment support
- Figma / image URL context injection
- Codebase auto-analysis (tech stack, frameworks, patterns)
- Clipboard integration and auto-open in VS Code Chat

### 0.1.0
- Initial release

---

## License

MIT © [Akhlaque](https://github.com/Akhlaquea01)

---

*Made with ❤️ for developers who ship faster with AI.*
