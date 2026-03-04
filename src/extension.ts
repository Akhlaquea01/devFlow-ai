import * as vscode from 'vscode';
import { SidebarProvider } from './providers/sidebarProvider';
import { CodebaseAnalyzer } from './services/codebaseAnalyzer';
import { RequirementParser } from './services/requirementParser';
import { buildStoryPrompt } from './prompts/storyPrompt';
import { buildPrdPrompt } from './prompts/prdPrompt';
import { buildTdsPrompt } from './prompts/tdsPrompt';
import { buildDigPrompt } from './prompts/digPrompt';
import { buildDevPrompt } from './prompts/devPrompt';

let analyzer: CodebaseAnalyzer;
let parser: RequirementParser;
let sidebarProvider: SidebarProvider;

const workflowOutputs: { story?: string; prd?: string; tds?: string; dig?: string; dev?: string } = {};
const outputPaths: { story?: string; prd?: string; tds?: string; dig?: string; dev?: string } = {};

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  analyzer = new CodebaseAnalyzer();
  parser = new RequirementParser();

  sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('devflow.generateStory', async (data: any) => {
      try {
        const requirement = await parser.parse(
          data.source,
          data.requirement,
          data.attachedFiles || [],
          data.imageUrls || []
        );

        const storyPrompt = buildStoryPrompt(requirement.parsedContent);
        const timestamp = Date.now().toString().slice(-4);
        const storyFileUri = await saveOutput(`Story_Prompt_${timestamp}.md`, storyPrompt);
        workflowOutputs.story = storyPrompt;
        outputPaths.story = storyFileUri.fsPath;

        await vscode.env.clipboard.writeText(storyPrompt);
        vscode.commands.executeCommand('workbench.action.chat.open', { query: storyPrompt });

        sidebarProvider.postMessage({
          command: 'generationComplete',
          data: { step: 'story', filePath: storyFileUri.fsPath, message: 'Story Prompt copied to clipboard and sent to Chat.' },
        });

      } catch (error: any) {
        sidebarProvider.postMessage({
          command: 'error',
          data: { message: error?.message || 'An unexpected error occurred' },
        });
        vscode.window.showErrorMessage(`DevFlow Error: ${error?.message ?? String(error)}`);
      }
    }),

    vscode.commands.registerCommand('devflow.generatePrd', async (data: any) => {
      try {
        const requirement = await vscode.workspace.fs.readFile(vscode.Uri.file(data.storyPath)).then(b => b.toString());

        const profile = await analyzer.analyze();
        const codebaseContext = analyzer.summarize(profile);

        const prdPrompt = buildPrdPrompt(requirement, codebaseContext, data.scope);
        const timestamp = Date.now().toString().slice(-4);
        const prdFileUri = await saveOutput(`PRD_Prompt_${timestamp}.md`, prdPrompt);
        workflowOutputs.prd = prdPrompt;
        outputPaths.prd = prdFileUri.fsPath;

        await vscode.env.clipboard.writeText(prdPrompt);
        vscode.commands.executeCommand('workbench.action.chat.open', { query: prdPrompt });

        sidebarProvider.postMessage({
          command: 'generationComplete',
          data: { step: 'prd', filePath: prdFileUri.fsPath, message: 'PRD Prompt copied to clipboard and sent to Chat.' },
        });

      } catch (error: any) {
        sidebarProvider.postMessage({
          command: 'error',
          data: { message: error?.message || 'An unexpected error occurred' },
        });
        vscode.window.showErrorMessage(`DevFlow Error: ${error?.message ?? String(error)}`);
      }
    }),

    vscode.commands.registerCommand('devflow.generateTds', async (data: any) => {
      try {
        const profile = await analyzer.analyze();
        const codebaseContext = analyzer.summarize(profile);

        const prdContent = await vscode.workspace.fs.readFile(vscode.Uri.file(data.prdPath)).then(b => b.toString());

        const tdsPrompt = buildTdsPrompt(prdContent, codebaseContext);
        const timestamp = Date.now().toString().slice(-4);
        const tdsFileUri = await saveOutput(`TDS_Prompt_${timestamp}.md`, tdsPrompt);
        workflowOutputs.tds = tdsPrompt;
        outputPaths.tds = tdsFileUri.fsPath;

        await vscode.env.clipboard.writeText(tdsPrompt);
        vscode.commands.executeCommand('workbench.action.chat.open', { query: tdsPrompt });

        sidebarProvider.postMessage({
          command: 'generationComplete',
          data: { step: 'tds', filePath: tdsFileUri.fsPath, message: 'TDS Prompt copied to clipboard and sent to Chat.' },
        });
      } catch (error: any) {
        sidebarProvider.postMessage({ command: 'error', data: { message: error?.message || 'An unexpected error occurred' } });
      }
    }),

    vscode.commands.registerCommand('devflow.generateDig', async (data: any) => {
      try {
        const profile = await analyzer.analyze();
        const codebaseContext = analyzer.summarize(profile);

        const tdsContent = await vscode.workspace.fs.readFile(vscode.Uri.file(data.tdsPath)).then(b => b.toString());

        const digPrompt = buildDigPrompt(tdsContent, codebaseContext);
        const timestamp = Date.now().toString().slice(-4);
        const digFileUri = await saveOutput(`DIG_Prompt_${timestamp}.md`, digPrompt);
        workflowOutputs.dig = digPrompt;
        outputPaths.dig = digFileUri.fsPath;

        await vscode.env.clipboard.writeText(digPrompt);
        vscode.commands.executeCommand('workbench.action.chat.open', { query: digPrompt });

        sidebarProvider.postMessage({
          command: 'generationComplete',
          data: { step: 'dig', filePath: digFileUri.fsPath, message: 'DIG Prompt copied to clipboard and sent to Chat.' },
        });
      } catch (error: any) {
        sidebarProvider.postMessage({ command: 'error', data: { message: error?.message || 'An unexpected error occurred' } });
      }
    }),

    vscode.commands.registerCommand('devflow.generateDev', async (data: any) => {
      try {
        const profile = await analyzer.analyze();
        const codebaseContext = analyzer.summarize(profile);

        const digContent = await vscode.workspace.fs.readFile(vscode.Uri.file(data.digPath)).then(b => b.toString());

        const devPrompt = buildDevPrompt(digContent, codebaseContext);
        const timestamp = Date.now().toString().slice(-4);
        const devFileUri = await saveOutput(`DEV_Prompt_${timestamp}.md`, devPrompt);
        workflowOutputs.dev = devPrompt;
        outputPaths.dev = devFileUri.fsPath;

        await vscode.env.clipboard.writeText(devPrompt);
        vscode.commands.executeCommand('workbench.action.chat.open', { query: devPrompt });

        sidebarProvider.postMessage({
          command: 'generationComplete',
          data: { step: 'dev', filePath: devFileUri.fsPath, message: 'DEV Prompt copied to clipboard and sent to Chat.' },
        });
      } catch (error: any) {
        sidebarProvider.postMessage({ command: 'error', data: { message: error?.message || 'An unexpected error occurred' } });
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
      if (data.tab === 'story') {
        content = workflowOutputs.story || '';
      } else if (data.tab === 'prd') {
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

  context.subscriptions.push(
    vscode.commands.registerCommand('devflow.startWorkflow', () => {
      vscode.commands.executeCommand('workbench.view.extension.devflow-sidebar');
    })
  );
}

async function saveOutput(filename: string, content: string): Promise<vscode.Uri> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    throw new Error('No workspace folder found');
  }
  const outputDir = vscode.Uri.joinPath(folders[0].uri, '.devflow', 'prompts');
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

