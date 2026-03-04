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

  private async handleSelectFiles(): Promise<void> {
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

