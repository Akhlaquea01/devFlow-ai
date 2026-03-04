import * as vscode from 'vscode';
import { SidebarProvider } from './providers/sidebarProvider';
import { CodebaseAnalyzer } from './services/codebaseAnalyzer';
import { RequirementParser } from './services/requirementParser';
import { buildPrdPrompt } from './prompts/prdPrompt';
import { buildTdsPrompt } from './prompts/tdsPrompt';
import { buildDigPrompt } from './prompts/digPrompt';
import { buildDevPrompt } from './prompts/devPrompt';

let analyzer: CodebaseAnalyzer;
let parser: RequirementParser;
let sidebarProvider: SidebarProvider;

const workflowOutputs: { prd?: string; tds?: string; dig?: string; dev?: string } = {};
const outputPaths: { prd?: string; tds?: string; dig?: string; dev?: string } = {};

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  analyzer = new CodebaseAnalyzer();
  parser = new RequirementParser();

  sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('devflow.startWorkflow', async (data: any) => {
      try {
        sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 0 } });
        const requirement = await parser.parse(
          data.source,
          data.requirement,
          data.attachedFiles || [],
          data.imageUrls || []
        );

        sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 1 } });
        const profile = await analyzer.analyze();
        const codebaseContext = analyzer.summarize(profile);

        sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 2 } });
        const prdPrompt = buildPrdPrompt(requirement.parsedContent, codebaseContext, data.scope);
        const prdFileUri = await saveOutput('PRD.md', prdPrompt);
        workflowOutputs.prd = prdPrompt;
        outputPaths.prd = prdFileUri.fsPath;

        sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 3 } });
        const tdsPrompt = buildTdsPrompt(prdFileUri.fsPath, codebaseContext);
        const tdsFileUri = await saveOutput('TDS.md', tdsPrompt);
        workflowOutputs.tds = tdsPrompt;
        outputPaths.tds = tdsFileUri.fsPath;

        sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 4 } });
        const digPrompt = buildDigPrompt(tdsFileUri.fsPath, codebaseContext);
        const digFileUri = await saveOutput('DIG.md', digPrompt);
        workflowOutputs.dig = digPrompt;
        outputPaths.dig = digFileUri.fsPath;

        sidebarProvider.postMessage({ command: 'stepUpdate', data: { stepIndex: 5 } });
        const devPrompt = buildDevPrompt(digFileUri.fsPath, codebaseContext);
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

        vscode.window.showInformationMessage(
          'DevFlow: Workflow complete! Prompt templates generated in .devflow folder.',
        );
      } catch (error: any) {
        sidebarProvider.postMessage({
          command: 'error',
          data: { message: error?.message || 'An unexpected error occurred' },
        });
        vscode.window.showErrorMessage(`DevFlow Error: ${error?.message ?? String(error)}`);
      }
    }),

    vscode.commands.registerCommand('devflow.analyzeCodebase', async () => {
      const profile = await analyzer.analyze();
      const summary = analyzer.summarize(profile);
      const doc = await vscode.workspace.openTextDocument({
        content: summary,
        language: 'markdown',
      });
      vscode.window.showTextDocument(doc);
    }),

    vscode.commands.registerCommand('devflow.switchTab', (data: { tab: string }) => {
      let content = '';
      if (data.tab === 'prd') {
        content = workflowOutputs.prd || '';
      } else if (data.tab === 'tds') {
        content = workflowOutputs.tds || '';
      } else if (data.tab === 'dig') {
        content = workflowOutputs.dig || '';
      } else if (data.tab === 'dev') {
        content = workflowOutputs.dev || '';
      }
      sidebarProvider.postMessage({
        command: 'tabContent',
        data: { html: `<pre style="white-space:pre-wrap">${escapeHtml(content)}</pre>` },
      });
    }),

    vscode.commands.registerCommand('devflow.openPromptFile', async (data: { fileType: string }) => {
      try {
        const filePath = (outputPaths as any)[data.fileType];
        if (filePath) {
          const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
          vscode.window.showTextDocument(doc);
        } else {
          vscode.window.showErrorMessage(`File not generated yet for: ${data.fileType}`);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to open file: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand('devflow.copyPrompt', async (data: { fileType: string }) => {
      try {
        const content = (workflowOutputs as any)[data.fileType];
        if (content) {
          await vscode.env.clipboard.writeText(content);
          vscode.window.showInformationMessage(`DevFlow: Copied ${data.fileType.toUpperCase()} prompt to clipboard`);
        } else {
          vscode.window.showErrorMessage(`Content not generated yet for: ${data.fileType}`);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to copy to clipboard: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand('devflow.showHelp', async () => {
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
    }),
  );

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.text = '$(rocket) DevFlow AI';
  statusBar.command = 'devflow.startWorkflow';
  statusBar.tooltip = 'Start DevFlow AI Workflow';
  statusBar.show();
  context.subscriptions.push(statusBar);
}

async function saveOutput(filename: string, content: string): Promise<vscode.Uri> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    throw new Error('No workspace folder found');
  }
  const outputDir = vscode.Uri.joinPath(folders[0].uri, '.devflow');
  try {
    await vscode.workspace.fs.createDirectory(outputDir);
  } catch {
    // ignore
  }
  const fileUri = vscode.Uri.joinPath(outputDir, filename);
  await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf-8'));
  return fileUri;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function deactivate(): void {
  // no-op
}

