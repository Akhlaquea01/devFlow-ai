# DevFlow AI

> Your ultimate AI prompt engineering workbench, natively integrated into VS Code.

DevFlow AI transforms how developers interact with Large Language Models (LLMs) by turning disorganized requirements into highly structured, context-rich development prompts. Built on the principles of modularity and reusability, DevFlow AI helps you extract maximum value from any AI-coding assistant (like ChatGPT, Claude, Gemini, or Copilot) without requiring complex setup, API keys, or subscriptions.

## 🚀 Features

### 📝 Step-by-Step Prompt Generation Wizard
With DevFlow AI, you don’t need to be a prompt engineering expert. A guided step-by-step wizard walks you through creating foundational engineering documents. Start with a plain text requirement and sequentially build:
1. **Product Requirements Document (PRD):** Define the "Why" and "What" of your feature.
2. **Technical Design Specification (TDS):** Dictate the "How", including system architecture and data flows.
3. **Development Implementation Guide (DIG):** Break down the work into actionable coding steps.
4. **Development (DEV) Prompts:** Provide hyper-specific, file-by-file context directly to your AI.

### 🧠 Contextual Awareness using Workspace Files
Say goodbye to copy-pasting code snippets! Attach relevant code context within your prompt templates to automatically inject it into your prompts. Need the `package.json` dependencies or the `User` model definition? Just add the context, and DevFlow AI does the heavy lifting.

### 📁 Automatic Markdown Export
Every prompt document you generate is automatically saved in a structured `.devflow` directory within your workspace. Easily version control, share, and review your prompts alongside your regular code.

### 🎨 Clean, Lightweight Workbench UI
DevFlow AI embraces the Unix philosophy: do one thing and do it well. It offers a standalone sidebar interface completely focused on crafting the perfect prompt.

## 🛠️ Getting Started

1. Open the DevFlow AI sidebar by clicking the **DevFlow icon** in your Activity Bar, or by running `DevFlow: Start Workflow` (`Ctrl+Shift+D` / `Cmd+Shift+D`).
2. Start the Prompt Generation Wizard.
3. Fill in your requirements for the PRD.
4. Add file context by searching for file paths within your workspace.
5. Click **Generate PRD** to save the document.
6. Proceed to the next stages (TDS, DIG, DEV) when you're ready!

## ⚙️ Extension Settings

This extension contributes the following settings:

* `devflow.defaultScope`: Set the default implementation scope (e.g., `fullstack`, `frontend`, `backend`).

## 🤝 Support & Feedback

Developed by **Akhlaque** for **MasTi**. If you encounter any issues or have feature requests, please reach out to the team!

**Enjoy the DevFlow!**
