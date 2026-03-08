import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'devflow.sidebarView';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.command) {
        case 'generateStory':
          vscode.commands.executeCommand('devflow.generateStory', msg.data);
          break;
        case 'generatePrd':
          vscode.commands.executeCommand('devflow.generatePrd', msg.data);
          break;
        case 'generateTds':
          vscode.commands.executeCommand('devflow.generateTds', msg.data);
          break;
        case 'generateDig':
          vscode.commands.executeCommand('devflow.generateDig', msg.data);
          break;
        case 'generateDev':
          vscode.commands.executeCommand('devflow.generateDev', msg.data);
          break;
        case 'analyzeCodebase':
          vscode.commands.executeCommand('devflow.analyzeCodebase');
          break;
        case 'resetWorkflow':
          vscode.commands.executeCommand('devflow.resetWorkflow');
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
        case 'selectStoryMd':
          this.handleSelectFiles({ multiple: false, filters: { 'Markdown': ['md'] }, target: 'storyMd' });
          break;
        case 'selectFiles':
          this.handleSelectFiles(msg?.data || {});
          break;
        default:
          break;
      }
    });
  }

  private async handleSelectFiles(options: any = {}): Promise<void> {
    const uris = await vscode.window.showOpenDialog({
      canSelectMany: options.multiple !== false,
      openLabel: 'Attach to Context',
      canSelectFiles: true,
      canSelectFolders: false,
      filters: options.filters || undefined
    });

    if (uris && uris.length > 0) {
      const filePaths = uris.map(uri => uri.fsPath);
      // If a specific target is set, pass it back for routing in sidebar.js
      this.postMessage({ command: 'filesSelected', data: { filePaths, target: options.target } });
    }
  }

  public postMessage(message: unknown): void {
    this._view?.webview.postMessage(message);
  }

  private getHtml(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'sidebar', 'sidebar.css'),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'sidebar', 'sidebar.js'),
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https: data:;">
  <link href="${styleUri}" rel="stylesheet">
  <title>DevFlow AI</title>
</head>
<body>
  <div id="app">
    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
      <button id="analyze-workspace-btn" class="secondary-btn" style="padding: 6px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; cursor: pointer; border-radius: 2px;">🔍 Analyze Workspace</button>
      <button id="reset-workflow-btn" class="secondary-btn" style="padding: 6px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; cursor: pointer; border-radius: 2px;">Reset Workflow</button>
    </div>

    <div id="workspace-analysis-result" style="display:none; margin-bottom:10px; padding:10px; background:var(--vscode-editorInfo-background); color:var(--vscode-editorInfo-foreground); font-size:12px; border-radius:4px; white-space:pre-wrap;"></div>

    <!-- Step Progress Indicator -->
    <div class="step-indicator" style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; font-weight: bold; color: var(--vscode-descriptionForeground);">
      <span id="indicator-story" style="color: var(--vscode-foreground);">① STORY</span>
      <span>→</span>
      <span id="indicator-prd">② PRD</span>
      <span>→</span>
      <span id="indicator-tds">③ TDS</span>
      <span>→</span>
      <span id="indicator-dig">④ DIG</span>
      <span>→</span>
      <span id="indicator-dev">⑤ DEV</span>
    </div>

    <!-- Step 1: Story -->
    <section class="panel" id="step1-section">
      <h3 class="panel-title">1️⃣ Generate Story Prompt</h3>
      <div class="input-group">
        <select id="input-source">
          <option value="text">Text / Prompt</option>
          <option value="clipboard">Paste from Clipboard</option>
          <option value="jira">Jira Issue</option>
          <option value="mdfile">Browse MD File</option>
        </select>

        <!-- MD File picker (shown when 'Browse MD File' is selected) -->
        <div id="story-md-picker" style="display:none; margin-top:6px;">
          <div style="display:flex; gap: 8px;">
            <input type="text" id="story-md-path" readonly placeholder="No MD file selected" style="flex:1; padding:6px; background:var(--vscode-input-background); color:var(--vscode-input-foreground); border:1px solid var(--vscode-input-border); border-radius:2px;">
            <button id="browse-story-md-btn" class="secondary-btn" style="padding:6px; background:var(--vscode-button-secondaryBackground); color:var(--vscode-button-secondaryForeground); border:none; cursor:pointer; border-radius:2px;">📂 Browse</button>
          </div>
          <div style="font-size:0.8em; color:var(--vscode-descriptionForeground); margin-top:4px;">The AI will read this file directly — no copy-paste needed.</div>
        </div>

        <!-- Text input (shown for text / jira / clipboard modes) -->
        <div id="story-text-input-area">
          <textarea id="requirement-input" placeholder="Describe your requirement..." rows="4"></textarea>
          <div class="attachment-group" style="margin-top: 5px;">
            <input type="text" id="image-url-input" placeholder="Figma or Image URL (optional)" style="width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 6px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 2px;">
            <button id="attach-files-btn" class="secondary-btn" style="width: 100%; padding: 6px; margin-bottom: 8px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; cursor: pointer; border-radius: 2px;">📎 Attach Context Files</button>
            <div id="attached-files-list" style="font-size: 0.85em; color: var(--vscode-descriptionForeground); margin-bottom: 5px;"></div>
          </div>
        </div>

        <button id="generate-story-btn" class="primary-btn">🚀 Generate Story Prompt</button>
        <div id="step1-status" style="margin-top: 6px; font-size: 0.85em; color: var(--vscode-descriptionForeground);"></div>
      </div>
    </section>

    <!-- Step 2: PRD -->
    <section class="panel" id="step2-section">
      <h3 class="panel-title">2️⃣ Generate PRD Prompt</h3>
      <div class="input-group">
        <label class="field-label">Select Story file (auto-filled or browse existing):</label>
        <div style="display:flex; gap: 8px;">
          <input type="text" id="story-file-input" readonly placeholder="No Story selected" style="flex:1">
          <button id="select-story-btn" class="secondary-btn" style="padding: 6px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; cursor: pointer; border-radius: 2px;">Browse</button>
        </div>

        <div class="scope-selector" style="margin-top: 10px;">
          <label>Scope:</label>
          <div class="radio-group">
            <label><input type="radio" name="scope" value="fullstack" checked> Full Stack</label>
            <label><input type="radio" name="scope" value="ui"> UI Only</label>
            <label><input type="radio" name="scope" value="backend"> Backend</label>
            <label><input type="radio" name="scope" value="testing"> Testing</label>
          </div>
        </div>

        <button id="generate-prd-btn" class="primary-btn" disabled style="margin-top: 10px;">🚀 Generate PRD Prompt</button>
      </div>
    </section>

    <!-- Step 3: TDS -->
    <section class="panel" id="step3-section">
      <h3 class="panel-title" style="display:flex; justify-content:space-between">3️⃣ Generate TDS Prompt <span id="step3-status" style="font-size: 0.8em; font-weight: normal; color: var(--vscode-descriptionForeground)"></span></h3>
      <div class="input-group">
        <label class="field-label">Select generated PRD file:</label>
        <div style="display:flex; gap: 8px;">
          <input type="text" id="prd-file-input" readonly placeholder="No PRD selected" style="flex:1">
          <button id="select-prd-btn" class="secondary-btn" style="padding: 6px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; cursor: pointer; border-radius: 2px;">Browse</button>
        </div>
        <button id="generate-tds-btn" class="primary-btn" disabled>🚀 Generate TDS Prompt</button>
      </div>
    </section>

    <!-- Step 4: DIG -->
    <section class="panel" id="step4-section">
      <h3 class="panel-title" style="display:flex; justify-content:space-between">4️⃣ Generate DIG Prompt <span id="step4-status" style="font-size: 0.8em; font-weight: normal; color: var(--vscode-descriptionForeground)"></span></h3>
      <div class="input-group">
        <label class="field-label">Select generated TDS file:</label>
        <div style="display:flex; gap: 8px;">
          <input type="text" id="tds-file-input" readonly placeholder="No TDS selected" style="flex:1">
          <button id="select-tds-btn" class="secondary-btn" style="padding: 6px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; cursor: pointer; border-radius: 2px;">Browse</button>
        </div>
        <button id="generate-dig-btn" class="primary-btn" disabled>🚀 Generate DIG Prompt</button>
      </div>
    </section>

    <!-- Step 5: DEV -->
    <section class="panel" id="step5-section">
      <h3 class="panel-title" style="display:flex; justify-content:space-between">5️⃣ Generate DEV Prompt <span id="step5-status" style="font-size: 0.8em; font-weight: normal; color: var(--vscode-descriptionForeground)"></span></h3>
      <div class="input-group">
        <label class="field-label">Select generated DIG file:</label>
        <div style="display:flex; gap: 8px;">
          <input type="text" id="dig-file-input" readonly placeholder="No DIG selected" style="flex:1">
          <button id="select-dig-btn" class="secondary-btn" style="padding: 6px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; cursor: pointer; border-radius: 2px;">Browse</button>
        </div>
        <button id="generate-dev-btn" class="primary-btn" disabled>🚀 Generate DEV Prompt</button>
      </div>
    </section>

    <!-- Output Status -->
    <div id="global-status" style="margin-top: 10px; font-size: 13px; color: var(--vscode-notificationsInfoIcon-foreground); display: none; padding: 10px; background: var(--vscode-editorInfo-background); border-radius: 4px;">
    </div>

    <!-- Preview Container -->
    <div id="preview-container" style="display:none; margin-top: 15px; background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); padding: 10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
        <h3 style="margin:0; font-size: 14px;">Prompt Preview</h3>
        <div>
          <button id="view-full-btn" class="secondary-btn" style="padding: 4px 8px; margin-right: 5px;">View Full</button>
          <button id="copy-preview-btn" class="secondary-btn" style="padding: 4px 8px;">Copy</button>
        </div>
      </div>
      <pre id="preview-content" style="white-space: pre-wrap; font-size: 12px; max-height: 250px; overflow-y: auto; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); border: none; padding: 0;"></pre>
    </div>
  </div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}

