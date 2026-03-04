/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(__webpack_require__(1));
const sidebarProvider_1 = __webpack_require__(2);
const codebaseAnalyzer_1 = __webpack_require__(3);
const requirementParser_1 = __webpack_require__(6);
const prdPrompt_1 = __webpack_require__(7);
const tdsPrompt_1 = __webpack_require__(8);
const digPrompt_1 = __webpack_require__(9);
const devPrompt_1 = __webpack_require__(10);
let analyzer;
let parser;
let sidebarProvider;
const workflowOutputs = {};
const outputPaths = {};
async function activate(context) {
    analyzer = new codebaseAnalyzer_1.CodebaseAnalyzer();
    parser = new requirementParser_1.RequirementParser();
    sidebarProvider = new sidebarProvider_1.SidebarProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebarProvider_1.SidebarProvider.viewType, sidebarProvider));
    context.subscriptions.push(vscode.commands.registerCommand('devflow.startWorkflow', async (data) => {
        try {
            sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 0 } });
            const requirement = await parser.parse(data.source, data.requirement, data.attachedFiles || [], data.imageUrls || []);
            sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 1 } });
            const profile = await analyzer.analyze();
            const codebaseContext = analyzer.summarize(profile);
            sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 2 } });
            const prdPrompt = (0, prdPrompt_1.buildPrdPrompt)(requirement.parsedContent, codebaseContext, data.scope);
            const prdFileUri = await saveOutput('PRD.md', prdPrompt);
            workflowOutputs.prd = prdPrompt;
            outputPaths.prd = prdFileUri.fsPath;
            sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 3 } });
            const tdsPrompt = (0, tdsPrompt_1.buildTdsPrompt)(prdFileUri.fsPath, codebaseContext);
            const tdsFileUri = await saveOutput('TDS.md', tdsPrompt);
            workflowOutputs.tds = tdsPrompt;
            outputPaths.tds = tdsFileUri.fsPath;
            sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 4 } });
            const digPrompt = (0, digPrompt_1.buildDigPrompt)(tdsFileUri.fsPath, codebaseContext);
            const digFileUri = await saveOutput('DIG.md', digPrompt);
            workflowOutputs.dig = digPrompt;
            outputPaths.dig = digFileUri.fsPath;
            sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 5 } });
            const devPrompt = (0, devPrompt_1.buildDevPrompt)(digFileUri.fsPath, codebaseContext);
            const devFileUri = await saveOutput('DEV.md', devPrompt);
            workflowOutputs.dev = devPrompt;
            outputPaths.dev = devFileUri.fsPath;
            sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 6 } });
            sidebarProvider.postMessage({
                command: 'workflowComplete',
                data: {
                    html: `<pre style="white-space:pre-wrap">${escapeHtml(prdPrompt)}</pre>`,
                },
            });
            vscode.window.showInformationMessage('DevFlow: Workflow complete! Prompt templates generated in .devflow folder.');
        }
        catch (error) {
            sidebarProvider.postMessage({
                command: 'error',
                data: { message: error?.message || 'An unexpected error occurred' },
            });
            vscode.window.showErrorMessage(`DevFlow Error: ${error?.message ?? String(error)}`);
        }
    }), vscode.commands.registerCommand('devflow.analyzeCodebase', async () => {
        const profile = await analyzer.analyze();
        const summary = analyzer.summarize(profile);
        const doc = await vscode.workspace.openTextDocument({
            content: summary,
            language: 'markdown',
        });
        vscode.window.showTextDocument(doc);
    }), vscode.commands.registerCommand('devflow.switchTab', (data) => {
        let content = '';
        if (data.tab === 'prd') {
            content = workflowOutputs.prd || '';
        }
        else if (data.tab === 'tds') {
            content = workflowOutputs.tds || '';
        }
        else if (data.tab === 'dig') {
            content = workflowOutputs.dig || '';
        }
        else if (data.tab === 'dev') {
            content = workflowOutputs.dev || '';
        }
        sidebarProvider.postMessage({
            command: 'tabContent',
            data: { html: `<pre style="white-space:pre-wrap">${escapeHtml(content)}</pre>` },
        });
    }), vscode.commands.registerCommand('devflow.openPromptFile', async (data) => {
        try {
            const filePath = outputPaths[data.fileType];
            if (filePath) {
                const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
                vscode.window.showTextDocument(doc);
            }
            else {
                vscode.window.showErrorMessage(`File not generated yet for: ${data.fileType}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${error.message}`);
        }
    }), vscode.commands.registerCommand('devflow.copyPrompt', async (data) => {
        try {
            const content = workflowOutputs[data.fileType];
            if (content) {
                await vscode.env.clipboard.writeText(content);
                vscode.window.showInformationMessage(`DevFlow: Copied ${data.fileType.toUpperCase()} prompt to clipboard`);
            }
            else {
                vscode.window.showErrorMessage(`Content not generated yet for: ${data.fileType}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to copy to clipboard: ${error.message}`);
        }
    }), vscode.commands.registerCommand('devflow.showHelp', async () => {
        const help = [
            '# DevFlow AI',
            '',
            '## What this extension does',
            '- Turns a high-level requirement into four prompt artifacts: PRD, TDS, DIG, and DEV.',
            '- Analyzes your current workspace to give AI models context.',
            '- Outputs structured prompt files ready to be pasted into GitHub Copilot, Cursor, or ChatGPT.',
            '',
            '## How to use',
            '1. Open the DevFlow AI sidebar from the activity bar.',
            '2. In **Requirement Input**, paste a user story, ticket description, or requirement.',
            '3. Choose the implementation scope (Full Stack, UI, Backend, Testing).',
            '4. Click **🚀 Generate Prompts**.',
            '5. After generation, copy the prompt or open the generated file from the `.devflow` folder.',
            '6. Paste the prompt into an AI tool of your choice.',
            '',
            '## Commands',
            '- DevFlow: Start Workflow',
            '- DevFlow: Analyze Codebase',
            '- DevFlow: Show Help (this view)',
        ].join('\n');
        const doc = await vscode.workspace.openTextDocument({
            content: help,
            language: 'markdown',
        });
        vscode.window.showTextDocument(doc, { preview: true });
    }));
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBar.text = '$(rocket) DevFlow AI';
    statusBar.command = 'devflow.startWorkflow';
    statusBar.tooltip = 'Start DevFlow AI Workflow';
    statusBar.show();
    context.subscriptions.push(statusBar);
}
async function saveOutput(filename, content) {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
        throw new Error('No workspace folder found');
    }
    const outputDir = vscode.Uri.joinPath(folders[0].uri, '.devflow');
    try {
        await vscode.workspace.fs.createDirectory(outputDir);
    }
    catch {
        // ignore
    }
    const fileUri = vscode.Uri.joinPath(outputDir, filename);
    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf-8'));
    return fileUri;
}
function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function deactivate() {
    // no-op
}


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SidebarProvider = void 0;
const vscode = __importStar(__webpack_require__(1));
class SidebarProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this.getHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'startWorkflow':
                    vscode.commands.executeCommand('devflow.startWorkflow', msg.data);
                    break;
                case 'analyzeCodebase':
                    vscode.commands.executeCommand('devflow.analyzeCodebase');
                    break;
                case 'switchTab':
                    vscode.commands.executeCommand('devflow.switchTab', msg.data);
                    break;
                case 'openPromptFile':
                    vscode.commands.executeCommand('devflow.openPromptFile', msg.data);
                    break;
                case 'copyPrompt':
                    vscode.commands.executeCommand('devflow.copyPrompt', msg.data);
                    break;
                case 'selectFiles':
                    this.handleSelectFiles();
                    break;
                default:
                    break;
            }
        });
    }
    async handleSelectFiles() {
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: true,
            openLabel: 'Attach to Context',
            canSelectFiles: true,
            canSelectFolders: false,
        });
        if (uris && uris.length > 0) {
            const filePaths = uris.map(uri => uri.fsPath);
            this.postMessage({ command: 'filesSelected', data: { filePaths } });
        }
    }
    postMessage(message) {
        this._view?.webview.postMessage(message);
    }
    getHtml(webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'sidebar', 'sidebar.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'sidebar', 'sidebar.js'));
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>DevFlow AI</title>
</head>
<body>
  <div id="app">
    <section class="panel" id="input-section">
      <h3 class="panel-title">📥 Requirement Input</h3>
      <div class="input-group">
        <select id="input-source">
          <option value="text">Text / User Story</option>
          <option value="clipboard">Paste from Clipboard</option>
          <option value="jira">Jira Issue</option>
          <option value="file">Local File</option>
        </select>
        <textarea id="requirement-input" placeholder="Describe your requirement..." rows="6"></textarea>

        <div class="attachment-group" style="margin-top: 10px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 500;">Context Attachments:</label>
          <input type="text" id="image-url-input" placeholder="Figma or Image URL (optional)" style="width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 6px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;">
          <button id="attach-files-btn" class="secondary-btn" style="width: 100%; padding: 6px; margin-bottom: 8px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; cursor: pointer; border-radius: 2px;">📎 Attach Files (.txt, .md, etc)</button>
          <div id="attached-files-list" style="font-size: 0.85em; color: var(--vscode-descriptionForeground); margin-bottom: 10px;"></div>
        </div>

        <div class="scope-selector">
          <label>Scope:</label>
          <div class="radio-group">
            <label><input type="radio" name="scope" value="fullstack" checked> Full Stack</label>
            <label><input type="radio" name="scope" value="ui"> UI Only</label>
            <label><input type="radio" name="scope" value="backend"> Backend</label>
            <label><input type="radio" name="scope" value="testing"> Testing</label>
          </div>
        </div>
        <button id="start-btn" class="primary-btn">🚀 Generate Prompts</button>
      </div>
    </section>

    <section class="panel hidden" id="progress-section">
      <h3 class="panel-title">📊 Generation Progress</h3>
      <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
      <div class="step-list" id="step-list"></div>
    </section>

    <section class="panel hidden" id="output-section">
      <h3 class="panel-title">📋 Generated Prompts</h3>
      <div class="tabs">
        <button class="tab active" data-tab="prd">PRD</button>
        <button class="tab" data-tab="tds">TDS</button>
        <button class="tab" data-tab="dig">DIG</button>
        <button class="tab" data-tab="dev">DEV</button>
      </div>
      <div class="tab-content" id="output-content"></div>
      <div class="action-buttons" style="padding: 12px; display: flex; gap: 8px; border-top: 1px solid var(--border);">
        <button id="copy-btn" class="primary-btn secondary" style="flex:1">📋 Copy</button>
        <button id="open-btn" class="primary-btn secondary" style="flex:1">📄 Open File</button>
      </div>
    </section>
  </div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
    }
}
exports.SidebarProvider = SidebarProvider;
SidebarProvider.viewType = 'devflow.sidebarView';


/***/ }),
/* 3 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CodebaseAnalyzer = void 0;
const vscode = __importStar(__webpack_require__(1));
const path = __importStar(__webpack_require__(4));
const fs = __importStar(__webpack_require__(5));
class CodebaseAnalyzer {
    constructor() {
        const folders = vscode.workspace.workspaceFolders;
        this.workspaceRoot = folders?.[0]?.uri.fsPath || '';
    }
    async analyze() {
        const [techStack, structure, patterns] = await Promise.all([
            this.detectTechStack(),
            this.scanStructure(),
            this.detectPatterns(),
        ]);
        return {
            rootPath: this.workspaceRoot,
            techStack,
            structure,
            patterns,
            timestamp: new Date().toISOString(),
        };
    }
    async detectTechStack() {
        const stack = {
            languages: [],
            frameworks: [],
            buildTools: [],
            packageManager: 'npm',
        };
        const files = await fs.readdir(this.workspaceRoot).catch(() => []);
        if (files.includes('yarn.lock')) {
            stack.packageManager = 'yarn';
        }
        if (files.includes('pnpm-lock.yaml')) {
            stack.packageManager = 'pnpm';
        }
        if (files.includes('bun.lockb')) {
            stack.packageManager = 'bun';
        }
        const extensions = await this.collectFileExtensions();
        if (extensions.has('.ts') || extensions.has('.tsx')) {
            stack.languages.push('TypeScript');
        }
        if (extensions.has('.js') || extensions.has('.jsx')) {
            stack.languages.push('JavaScript');
        }
        if (extensions.has('.py')) {
            stack.languages.push('Python');
        }
        if (extensions.has('.java')) {
            stack.languages.push('Java');
        }
        if (extensions.has('.go')) {
            stack.languages.push('Go');
        }
        if (extensions.has('.rs')) {
            stack.languages.push('Rust');
        }
        if (extensions.has('.cs')) {
            stack.languages.push('C#');
        }
        try {
            const pkgPath = path.join(this.workspaceRoot, 'package.json');
            const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
            const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
            if (allDeps['react']) {
                stack.frameworks.push('React');
            }
            if (allDeps['@angular/core']) {
                stack.frameworks.push('Angular');
            }
            if (allDeps['vue']) {
                stack.frameworks.push('Vue');
            }
            if (allDeps['next']) {
                stack.frameworks.push('Next.js');
            }
            if (allDeps['express']) {
                stack.frameworks.push('Express');
            }
            if (allDeps['nestjs'] || allDeps['@nestjs/core']) {
                stack.frameworks.push('NestJS');
            }
            if (allDeps['fastify']) {
                stack.frameworks.push('Fastify');
            }
        }
        catch {
            // ignore
        }
        return stack;
    }
    async scanStructure(dir, depth = 0) {
        if (depth > 3) {
            return { directories: [], files: [] };
        }
        const targetDir = dir || this.workspaceRoot;
        const entries = await fs.readdir(targetDir, { withFileTypes: true }).catch(() => []);
        const ignore = new Set([
            'node_modules',
            '.git',
            'dist',
            'build',
            '.next',
            '__pycache__',
            '.venv',
            'coverage',
        ]);
        const dirs = [];
        const files = [];
        for (const entry of entries) {
            if (ignore.has(entry.name)) {
                continue;
            }
            if (entry.isDirectory()) {
                dirs.push(entry.name);
            }
            else {
                files.push(entry.name);
            }
        }
        return { directories: dirs, files };
    }
    async detectPatterns() {
        return {
            hasTests: (await this.pathExists('test')) ||
                (await this.pathExists('__tests__')) ||
                (await this.pathExists('spec')),
            hasCI: (await this.pathExists('.github/workflows')) ||
                (await this.pathExists('.gitlab-ci.yml')),
            hasDocker: (await this.pathExists('Dockerfile')) ||
                (await this.pathExists('docker-compose.yml')),
            hasEnvExample: (await this.pathExists('.env.example')) ||
                (await this.pathExists('.env.sample')),
            isMonorepo: (await this.pathExists('lerna.json')) ||
                (await this.pathExists('pnpm-workspace.yaml')),
        };
    }
    async collectFileExtensions() {
        const exts = new Set();
        const walk = async (dir, depth = 0) => {
            if (depth > 4) {
                return;
            }
            const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
            for (const entry of entries) {
                if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
                    continue;
                }
                if (entry.isFile()) {
                    exts.add(path.extname(entry.name));
                }
                else if (entry.isDirectory()) {
                    await walk(path.join(dir, entry.name), depth + 1);
                }
            }
        };
        await walk(this.workspaceRoot);
        return exts;
    }
    async pathExists(relativePath) {
        try {
            await fs.access(path.join(this.workspaceRoot, relativePath));
            return true;
        }
        catch {
            return false;
        }
    }
    summarize(profile) {
        const lines = [
            '## Codebase Profile',
            `- **Languages**: ${profile.techStack.languages.join(', ') || 'Unknown'}`,
            `- **Frameworks**: ${profile.techStack.frameworks.join(', ') || 'None detected'}`,
            `- **Package Manager**: ${profile.techStack.packageManager}`,
            `- **Has Tests**: ${profile.patterns.hasTests ? 'Yes' : 'No'}`,
            `- **Has CI/CD**: ${profile.patterns.hasCI ? 'Yes' : 'No'}`,
            `- **Has Docker**: ${profile.patterns.hasDocker ? 'Yes' : 'No'}`,
            `- **Monorepo**: ${profile.patterns.isMonorepo ? 'Yes' : 'No'}`,
            `- **Top-level dirs**: ${profile.structure.directories.join(', ')}`,
        ];
        return lines.join('\n');
    }
}
exports.CodebaseAnalyzer = CodebaseAnalyzer;


/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("fs/promises");

/***/ }),
/* 6 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RequirementParser = void 0;
const vscode = __importStar(__webpack_require__(1));
const path = __importStar(__webpack_require__(4));
class RequirementParser {
    async parse(source, requirement, attachedFiles = [], imageUrls = []) {
        let result = await this.getBaseParse(source, requirement);
        // Append attached files
        if (attachedFiles.length > 0) {
            result.parsedContent += '\n\n### Context Attachments:\n';
            for (const filePath of attachedFiles) {
                try {
                    const fileUri = vscode.Uri.file(filePath);
                    const data = await vscode.workspace.fs.readFile(fileUri);
                    const content = Buffer.from(data).toString('utf8');
                    const ext = path.extname(filePath).slice(1) || 'text';
                    const filename = path.basename(filePath);
                    result.parsedContent += `\n#### File: ${filename}\n\`\`\`${ext}\n${content}\n\`\`\`\n`;
                }
                catch (error) {
                    result.parsedContent += `\n#### File: ${path.basename(filePath)}\n> ⚠️ Failed to read file: ${error.message}\n`;
                }
            }
        }
        // Append image URLs
        if (imageUrls.length > 0) {
            result.parsedContent += '\n\n### Attached Screenshots / Figma:\n';
            for (const url of imageUrls) {
                result.parsedContent += `\n![Attached Media](${url})\n`;
            }
        }
        return result;
    }
    async getBaseParse(source, requirement) {
        if (source === 'file') {
            return this.parseFromFile(requirement);
        }
        else if (source === 'jira') {
            return this.parseFromJira(requirement);
        }
        return this.parseFromText(source, requirement);
    }
    async parseFromText(source, text) {
        return {
            source,
            title: text.split('\n')[0]?.substring(0, 80) || 'Untitled',
            rawContent: text,
            parsedContent: text,
            metadata: {},
        };
    }
    async parseFromFile(filePath) {
        try {
            let absolutePath = filePath;
            if (!path.isAbsolute(filePath)) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    absolutePath = path.join(workspaceFolders[0].uri.fsPath, filePath);
                }
            }
            const fileUri = vscode.Uri.file(absolutePath);
            const data = await vscode.workspace.fs.readFile(fileUri);
            const content = Buffer.from(data).toString('utf8');
            return {
                source: 'file',
                title: path.basename(filePath),
                rawContent: content,
                parsedContent: content,
                metadata: { filePath: absolutePath },
            };
        }
        catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    }
    async parseFromJira(ticketId) {
        return {
            source: 'jira',
            title: `Jira Ticket: ${ticketId.substring(0, 80)}`,
            rawContent: ticketId,
            parsedContent: `Jira Ticket Context: ${ticketId}\n\n(Note: Direct Jira integration may require configuration. Currently using ticket ID/URL as reference.)`,
            metadata: { ticketId },
        };
    }
}
exports.RequirementParser = RequirementParser;


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.buildPrdPrompt = buildPrdPrompt;
function buildPrdPrompt(requirement, codebaseContext, scope) {
    return `You are a **Senior Product Manager** acting as my peer collaborator. Help me create a comprehensive Product Requirements Document.

**Story**: ${requirement}

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


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.buildTdsPrompt = buildTdsPrompt;
function buildTdsPrompt(prdPath, codebaseContext) {
    return `You are a **Senior Software Architect** acting as my peer collaborator. Create a detailed Technical Design Specification based on the attached PRD.

@${prdPath}

**Codebase Context**:
${codebaseContext}

---

## Context

The PRD (attached above) defines the business requirements. Your job is to translate **every** PRD requirement into a concrete technical design. Every functional requirement (FR-xxx) must have a corresponding technical specification.

---

## Generate the Following Sections

### 1. PRD → Technical Requirements Mapping
Create a traceability matrix:

| PRD Req ID | PRD Title | Technical Approach | TDS Section |
|---|---|---|---|
| FR-001 | ... | ... | §3.2 |

⚠️ Flag any PRD requirements that are ambiguous or under-specified.

### 2. System Architecture
- High-level architecture diagram (Mermaid syntax)
- Component breakdown with responsibilities
- Communication patterns (sync/async, event-driven, REST/gRPC)
- Data flow diagram for primary user workflows
- Deployment architecture (local, cloud, hybrid)

### 3. Technology Stack
| Layer | Technology | Justification |
|---|---|---|
| Language | ... | ... |
| Framework | ... | ... |
| Database | ... | ... |
| Messaging | ... | ... |
| Caching | ... | ... |

### 4. Database Design
- Entity-Relationship diagram (Mermaid syntax)
- Table/collection schemas with field types and constraints
- Indexes for query performance
- Migration strategy (up/down migrations)
- Data seeding approach
- Map each entity to PRD requirements

### 5. API Design
For each endpoint:
- **Method + Path**: \\\`POST /api/v1/resource\\\`
- **Purpose**: What PRD requirement it fulfills
- **Request Schema**: JSON with types and validation
- **Response Schema**: Success and error responses
- **Auth**: Required permissions/roles
- **Rate Limiting**: Applicable limits
- **Idempotency**: Strategy for safe retries

### 6. Component Design
For each major module/component:
- **Responsibility**: Single Responsibility description
- **Interface**: Public API / Props / Inputs
- **Internal Logic**: Key algorithms and decision trees
- **Dependencies**: What it depends on
- **Error Handling**: Failure modes and recovery
- **State Management**: How state is managed

### 7. Third-Party Integrations
For each external service:
- Service name and purpose
- Authentication method
- Key API endpoints used
- Error handling and retry strategy
- Rate limits and quota management
- Fallback behavior if service is unavailable
- Cost implications

### 8. Security Design
- Authentication flow (sequence diagram)
- Authorization model (RBAC, ABAC, or similar)
- Data encryption (at rest, in transit)
- Input validation strategy
- Secret management approach
- OWASP Top 10 mitigation
- Compliance requirements (GDPR, SOC2, etc.)

### 9. Performance Design
- Performance budgets and SLA targets
- Caching strategy (layers, TTL, invalidation)
- Database query optimization approach
- Lazy loading and code splitting strategy
- CDN and asset optimization
- Load testing approach and targets

### 10. Error Handling & Observability
- Error classification (user errors, system errors, transient)
- Logging strategy (levels, structured logging, correlation IDs)
- Monitoring and alerting (metrics, dashboards)
- Distributed tracing approach
- Health check endpoints

### 11. Testing Strategy
| Test Type | Scope | Tools | Coverage Target |
|---|---|---|---|
| Unit | ... | ... | 80%+ |
| Integration | ... | ... | ... |
| E2E | ... | ... | ... |
| Performance | ... | ... | ... |

### 12. Risk Assessment
| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| ... | High/Med/Low | High/Med/Low | ... | ... |

- Rollback strategy for each major component
- Backward compatibility approach
- Data migration rollback plan

---

## Output Rules

- Use Mermaid for all diagrams
- Every technical decision must reference the PRD requirement it addresses
- Include code-level details: class names, function signatures, file paths
- Flag unknowns with \\\`🔴 DECISION NEEDED\\\` markers
- Provide alternatives for major design decisions with trade-off analysis
- This TDS will be the direct input for DIG creation

---

**Output Format**: Detailed Markdown TDS with diagrams, schemas, and full traceability to PRD.`;
}


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.buildDigPrompt = buildDigPrompt;
function buildDigPrompt(tdsPath, codebaseContext) {
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


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.buildDevPrompt = buildDevPrompt;
function buildDevPrompt(digPath, codebaseContext) {
    return `You are a **Senior Full-Stack Developer** acting as my pair programmer. Help me implement the code following the attached Development Implementation Guide (DIG).

@${digPath}

**Codebase Context**:
${codebaseContext}

---

## Context

The DIG (attached above) contains the complete, step-by-step implementation plan built from the TDS and PRD. Your job is to help me write **production-quality code** that precisely follows the DIG specifications.

---

## Your Responsibilities

### 1. DIG-Driven Development (Primary Focus)
- Follow the DIG implementation roadmap **step by step**
- Before writing code, confirm which DIG step we're implementing
- Reference the DIG checklist and mark progress
- Ensure every code block maps to a specific DIG step
- Alert me if I'm skipping steps or deviating from the plan

### 2. Code Quality Standards
- Write **clean, self-documenting code** — no clever one-liners
- Follow project naming conventions (from codebase context)
- Use strict TypeScript types — no \\\`any\\\` unless absolutely necessary
- Apply SOLID principles and relevant design patterns from TDS
- Add JSDoc comments for public APIs and complex logic
- Keep functions under 30 lines; extract when they grow
- Use meaningful variable names that explain intent

### 3. Architecture Compliance
- Match the TDS architecture exactly
- Follow the file structure from DIG §4
- Use the design patterns specified in TDS
- Maintain separation of concerns (controller → service → repository)
- Ensure dependency injection where specified
- Don't introduce new patterns without discussing trade-offs

### 4. Error Handling (Non-Negotiable)
- Every external call must have try/catch
- Use typed error classes, not generic Error
- Return user-friendly error messages
- Log errors with correlation IDs and context
- Handle edge cases listed in DIG §12
- Implement graceful degradation for AI provider failures

### 5. Testing (Write Tests as You Go)
- Write unit tests **alongside** implementation, not after
- Follow the test spec from DIG §10
- Use descriptive test names: \\\`should [expected behavior] when [condition]\\\`
- Mock external dependencies
- Aim for the coverage targets from TDS §11
- Include happy path, error path, and edge case tests

### 6. Implementation Workflow Per Step
For each DIG step, follow this exact workflow:

\\\`\\\`\\\`
1. Read the DIG step carefully
2. Identify files to create/modify
3. Write the implementation code
4. Write corresponding tests
5. Verify the step works (run tests, manual check)
6. Commit with the message from DIG
7. Move to the next step
\\\`\\\`\\\`

### 7. Git Discipline
- One commit per DIG step (atomic commits)
- Use conventional commit messages from DIG: \\\`feat(scope): description\\\`
- Don't mix refactoring with feature commits
- Create PR-ready commits with clean history

### 8. Performance Awareness
- Don't premature-optimize, but avoid obvious anti-patterns
- Use lazy loading where specified by TDS
- Implement caching as designed
- Profile bottlenecks before optimizing
- Respect the performance budgets from TDS §9

### 9. Security Practices
- Never hardcode secrets — use VS Code SecretStorage
- Validate and sanitize all user inputs
- Follow the auth flow from TDS §8
- Don't log sensitive data
- Use parameterized queries for database operations

---

## How to Help Me

When I ask for help:
1. **First** — check what the DIG says about that component
2. **Then** — provide code that matches the DIG/TDS specifications
3. **Alert me** if I'm deviating from the plan
4. **Suggest** when to move to the next DIG step
5. **Reference** specific DIG step numbers in your responses (e.g., "Per DIG Step 7...")

When the DIG is unclear:
- Make implementation decisions that **align with TDS architecture**
- Document the decision as a code comment: \\\`// DECISION: [rationale]\\\`
- Flag for DIG update later

---

## Response Format

For each implementation response, structure as:

\\\`\\\`\\\`
### DIG Step [N]: [Title]

**Files Changed:**
- \\\`path/to/file.ts\\\` — [what changed]

**Implementation:**
[Complete, working code]

**Tests:**
[Corresponding test code]

**Verification:**
- [ ] Step verified by [method]

**Next Step:** DIG Step [N+1]: [Title]
\\\`\\\`\\\`

---

**Let's begin.** Tell me which DIG step to start with, or I'll start from Step 1.`;
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map