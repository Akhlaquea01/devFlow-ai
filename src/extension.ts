import './polyfills';
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
        // If user selected an existing MD file, read it from disk instead of using textarea text
        let requirementText: string;
        const storyInputFilePath: string | undefined = data.storyFilePath;
        if (storyInputFilePath) {
          requirementText = Buffer.from(
            await vscode.workspace.fs.readFile(vscode.Uri.file(storyInputFilePath))
          ).toString('utf8');
        } else {
          const requirement = await parser.parse(
            data.source,
            data.requirement,
            data.attachedFiles || [],
            data.imageUrls || []
          );
          requirementText = requirement.parsedContent;
        }

        // Analyze the codebase (reads package.json, detects tech stack, etc.)
        const profile = await analyzer.analyze();
        const codebaseContext = analyzer.summarize(profile);

        const workspaceFolders = vscode.workspace.workspaceFolders;

        // Compute the output path first so we can pass it into the prompt
        let storyOutputPath: string | undefined;
        let storyUri: vscode.Uri | undefined;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const devflowDir = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow');
          try { await vscode.workspace.fs.createDirectory(devflowDir); } catch { /* already exists */ }
          storyUri = vscode.Uri.joinPath(devflowDir, 'STORY.md');
          storyOutputPath = storyUri.fsPath;
        }

        let storyPrompt = buildStoryPrompt(
          requirementText,
          codebaseContext,
          undefined,
          storyOutputPath,
          storyInputFilePath
        );

        // Template Overrides
        if (workspaceFolders && workspaceFolders.length > 0) {
          try {
            const templatePath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow', 'templates', 'story.template.md');
            const templateData = await vscode.workspace.fs.readFile(templatePath);
            let customTemplate = Buffer.from(templateData).toString('utf8');
            customTemplate = customTemplate.replace(/\{\{requirement\}\}/g, () => requirementText);
            customTemplate = customTemplate.replace(/\{\{codebaseContext\}\}/g, () => codebaseContext);
            storyPrompt = customTemplate;
          } catch { /* use default */ }
        }

        workflowOutputs.story = storyPrompt;

        // Save story prompt to .devflow/STORY.md and log session
        if (storyUri) {
          const devflowDir = vscode.Uri.joinPath(workspaceFolders![0].uri, '.devflow');

          let oldContent = '';
          try {
            oldContent = Buffer.from(await vscode.workspace.fs.readFile(storyUri)).toString('utf8');
          } catch { /* no file */ }

          if (oldContent && oldContent !== storyPrompt) {
            const tempOldUri = vscode.Uri.joinPath(devflowDir, 'STORY.old.md');
            await vscode.workspace.fs.writeFile(tempOldUri, Buffer.from(oldContent, 'utf8'));
            const tempNewUri = vscode.Uri.joinPath(devflowDir, 'STORY.new.md');
            await vscode.workspace.fs.writeFile(tempNewUri, Buffer.from(storyPrompt, 'utf8'));
            vscode.commands.executeCommand('vscode.diff', tempOldUri, tempNewUri, 'STORY.md (Old vs New)');
          }

          await vscode.workspace.fs.writeFile(storyUri, Buffer.from(storyPrompt, 'utf8'));

          const sessionLogPath = vscode.Uri.joinPath(devflowDir, 'session.json');
          let sessionLogs: any[] = [];
          try {
            const currentLogs = await vscode.workspace.fs.readFile(sessionLogPath);
            sessionLogs = JSON.parse(currentLogs.toString());
          } catch { /* file doesn't exist yet */ }
          sessionLogs.push({ timestamp: new Date().toISOString(), step: 'STORY', input: storyInputFilePath || data.source, output: 'STORY.md' });
          await vscode.workspace.fs.writeFile(sessionLogPath, Buffer.from(JSON.stringify(sessionLogs, null, 2), 'utf8'));
        }

        await vscode.env.clipboard.writeText(storyPrompt);
        vscode.commands.executeCommand('workbench.action.chat.open', { query: storyPrompt });

        sidebarProvider.postMessage({
          command: 'generationComplete',
          data: { step: 'story', message: 'Story Prompt sent to Chat. The AI will write output to STORY.md automatically.', outputPath: storyOutputPath, promptContent: storyPrompt },
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
        // Read story content as fallback (for title extraction), but pass the file path to the prompt
        const storyContent = await vscode.workspace.fs.readFile(vscode.Uri.file(data.storyPath)).then(b => b.toString());

        const profile = await analyzer.analyze();
        const codebaseContext = analyzer.summarize(profile);

        const workspaceFolders = vscode.workspace.workspaceFolders;

        // Compute output path before building prompt so it's embedded in the AI instructions
        let prdOutputPath: string | undefined;
        let prdUri: vscode.Uri | undefined;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const devflowDir = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow');
          prdUri = vscode.Uri.joinPath(devflowDir, 'PRD.md');
          prdOutputPath = prdUri.fsPath;
        }

        let prdPrompt = buildPrdPrompt(storyContent, codebaseContext, data.scope, data.storyPath, prdOutputPath);
        if (workspaceFolders && workspaceFolders.length > 0) {
          try {
            const templatePath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow', 'templates', 'prd.template.md');
            const templateData = await vscode.workspace.fs.readFile(templatePath);
            let customTemplate = Buffer.from(templateData).toString('utf8');
            customTemplate = customTemplate.replace(/\{\{requirement\}\}/g, () => storyContent);
            customTemplate = customTemplate.replace(/\{\{codebaseContext\}\}/g, () => codebaseContext);
            prdPrompt = customTemplate;
          } catch { /* use default */ }
        }

        workflowOutputs.prd = prdPrompt;

        if (prdUri && workspaceFolders && workspaceFolders.length > 0) {
          const devflowDir = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow');
          let oldContent = '';
          try {
            oldContent = Buffer.from(await vscode.workspace.fs.readFile(prdUri)).toString('utf8');
          } catch { /* no file */ }

          if (oldContent && oldContent !== prdPrompt) {
            const tempOldUri = vscode.Uri.joinPath(devflowDir, 'PRD.old.md');
            await vscode.workspace.fs.writeFile(tempOldUri, Buffer.from(oldContent, 'utf8'));
            const tempNewUri = vscode.Uri.joinPath(devflowDir, 'PRD.new.md');
            await vscode.workspace.fs.writeFile(tempNewUri, Buffer.from(prdPrompt, 'utf8'));
            vscode.commands.executeCommand('vscode.diff', tempOldUri, tempNewUri, 'PRD.md (Old vs New)');
          }

          await vscode.workspace.fs.writeFile(prdUri, Buffer.from(prdPrompt, 'utf8'));

          const sessionLogPath = vscode.Uri.joinPath(devflowDir, 'session.json');
          let sessionLogs: any[] = [];
          try {
            const currentLogs = await vscode.workspace.fs.readFile(sessionLogPath);
            sessionLogs = JSON.parse(currentLogs.toString());
          } catch { /* file doesn't exist yet */ }
          sessionLogs.push({ timestamp: new Date().toISOString(), step: 'PRD', input: data.storyPath, output: 'PRD.md' });
          await vscode.workspace.fs.writeFile(sessionLogPath, Buffer.from(JSON.stringify(sessionLogs, null, 2), 'utf8'));
        }

        await vscode.env.clipboard.writeText(prdPrompt);
        vscode.commands.executeCommand('workbench.action.chat.open', { query: prdPrompt });

        sidebarProvider.postMessage({
          command: 'generationComplete',
          data: { step: 'prd', message: 'PRD Prompt sent to Chat. The AI will read STORY.md and write output to PRD.md automatically.', promptContent: prdPrompt },
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

        // Read PRD content as fallback but pass the file path to the prompt
        const prdContent = await vscode.workspace.fs.readFile(vscode.Uri.file(data.prdPath)).then(b => b.toString());

        const workspaceFolders = vscode.workspace.workspaceFolders;

        let tdsOutputPath: string | undefined;
        let tdsUri: vscode.Uri | undefined;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const devflowDir = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow');
          tdsUri = vscode.Uri.joinPath(devflowDir, 'TDS.md');
          tdsOutputPath = tdsUri.fsPath;
        }

        let tdsPrompt = buildTdsPrompt(prdContent, codebaseContext, data.prdPath, tdsOutputPath);
        if (workspaceFolders && workspaceFolders.length > 0) {
          try {
            const templatePath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow', 'templates', 'tds.template.md');
            const templateData = await vscode.workspace.fs.readFile(templatePath);
            let customTemplate = Buffer.from(templateData).toString('utf8');
            customTemplate = customTemplate.replace(/\{\{prdContent\}\}/g, () => prdContent);
            customTemplate = customTemplate.replace(/\{\{codebaseContext\}\}/g, () => codebaseContext);
            tdsPrompt = customTemplate;
          } catch { /* use default */ }
        }

        workflowOutputs.tds = tdsPrompt;

        if (tdsUri && workspaceFolders && workspaceFolders.length > 0) {
          const devflowDir = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow');
          let oldContent = '';
          try {
            oldContent = Buffer.from(await vscode.workspace.fs.readFile(tdsUri)).toString('utf8');
          } catch { /* no file */ }

          if (oldContent && oldContent !== tdsPrompt) {
            const tempOldUri = vscode.Uri.joinPath(devflowDir, 'TDS.old.md');
            await vscode.workspace.fs.writeFile(tempOldUri, Buffer.from(oldContent, 'utf8'));
            const tempNewUri = vscode.Uri.joinPath(devflowDir, 'TDS.new.md');
            await vscode.workspace.fs.writeFile(tempNewUri, Buffer.from(tdsPrompt, 'utf8'));
            vscode.commands.executeCommand('vscode.diff', tempOldUri, tempNewUri, 'TDS.md (Old vs New)');
          }

          await vscode.workspace.fs.writeFile(tdsUri, Buffer.from(tdsPrompt, 'utf8'));

          const sessionLogPath = vscode.Uri.joinPath(devflowDir, 'session.json');
          let sessionLogs: any[] = [];
          try {
            const currentLogs = await vscode.workspace.fs.readFile(sessionLogPath);
            sessionLogs = JSON.parse(currentLogs.toString());
          } catch { /* file doesn't exist yet */ }
          sessionLogs.push({ timestamp: new Date().toISOString(), step: 'TDS', input: data.prdPath, output: 'TDS.md' });
          await vscode.workspace.fs.writeFile(sessionLogPath, Buffer.from(JSON.stringify(sessionLogs, null, 2), 'utf8'));
        }

        await vscode.env.clipboard.writeText(tdsPrompt);
        vscode.commands.executeCommand('workbench.action.chat.open', { query: tdsPrompt });

        sidebarProvider.postMessage({
          command: 'generationComplete',
          data: { step: 'tds', message: 'TDS Prompt sent to Chat. The AI will read PRD.md and write output to TDS.md automatically.', promptContent: tdsPrompt },
        });
      } catch (error: any) {
        sidebarProvider.postMessage({ command: 'error', data: { message: error?.message || 'An unexpected error occurred' } });
      }
    }),

    vscode.commands.registerCommand('devflow.generateDig', async (data: any) => {
      try {
        const profile = await analyzer.analyze();
        const codebaseContext = analyzer.summarize(profile);

        // Read TDS content as fallback, but pass file path to the prompt
        const tdsContent = await vscode.workspace.fs.readFile(vscode.Uri.file(data.tdsPath)).then(b => b.toString());

        const workspaceFolders = vscode.workspace.workspaceFolders;

        let digOutputPath: string | undefined;
        let digUri: vscode.Uri | undefined;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const devflowDir = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow');
          digUri = vscode.Uri.joinPath(devflowDir, 'DIG.md');
          digOutputPath = digUri.fsPath;
        }

        let digPrompt = buildDigPrompt(tdsContent, codebaseContext, data.tdsPath, digOutputPath);
        if (workspaceFolders && workspaceFolders.length > 0) {
          try {
            const templatePath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow', 'templates', 'dig.template.md');
            const templateData = await vscode.workspace.fs.readFile(templatePath);
            let customTemplate = Buffer.from(templateData).toString('utf8');
            customTemplate = customTemplate.replace(/\{\{tdsContent\}\}/g, () => tdsContent);
            customTemplate = customTemplate.replace(/\{\{codebaseContext\}\}/g, () => codebaseContext);
            digPrompt = customTemplate;
          } catch { /* use default */ }
        }

        workflowOutputs.dig = digPrompt;

        if (digUri && workspaceFolders && workspaceFolders.length > 0) {
          const devflowDir = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow');
          let oldContent = '';
          try {
            oldContent = Buffer.from(await vscode.workspace.fs.readFile(digUri)).toString('utf8');
          } catch { /* no file */ }

          if (oldContent && oldContent !== digPrompt) {
            const tempOldUri = vscode.Uri.joinPath(devflowDir, 'DIG.old.md');
            await vscode.workspace.fs.writeFile(tempOldUri, Buffer.from(oldContent, 'utf8'));
            const tempNewUri = vscode.Uri.joinPath(devflowDir, 'DIG.new.md');
            await vscode.workspace.fs.writeFile(tempNewUri, Buffer.from(digPrompt, 'utf8'));
            vscode.commands.executeCommand('vscode.diff', tempOldUri, tempNewUri, 'DIG.md (Old vs New)');
          }

          await vscode.workspace.fs.writeFile(digUri, Buffer.from(digPrompt, 'utf8'));

          const sessionLogPath = vscode.Uri.joinPath(devflowDir, 'session.json');
          let sessionLogs: any[] = [];
          try {
            const currentLogs = await vscode.workspace.fs.readFile(sessionLogPath);
            sessionLogs = JSON.parse(currentLogs.toString());
          } catch { /* file doesn't exist yet */ }
          sessionLogs.push({ timestamp: new Date().toISOString(), step: 'DIG', input: data.tdsPath, output: 'DIG.md' });
          await vscode.workspace.fs.writeFile(sessionLogPath, Buffer.from(JSON.stringify(sessionLogs, null, 2), 'utf8'));
        }

        await vscode.env.clipboard.writeText(digPrompt);
        vscode.commands.executeCommand('workbench.action.chat.open', { query: digPrompt });

        sidebarProvider.postMessage({
          command: 'generationComplete',
          data: { step: 'dig', message: 'DIG Prompt sent to Chat. The AI will read TDS.md and write output to DIG.md automatically.', promptContent: digPrompt },
        });
      } catch (error: any) {
        sidebarProvider.postMessage({ command: 'error', data: { message: error?.message || 'An unexpected error occurred' } });
      }
    }),

    vscode.commands.registerCommand('devflow.generateDev', async (data: any) => {
      try {
        const profile = await analyzer.analyze();
        const codebaseContext = analyzer.summarize(profile);

        // Read DIG content as fallback, but pass file path to the prompt
        const digContent = await vscode.workspace.fs.readFile(vscode.Uri.file(data.digPath)).then(b => b.toString());

        const workspaceFolders = vscode.workspace.workspaceFolders;

        let devOutputPath: string | undefined;
        let devUri: vscode.Uri | undefined;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const devflowDir = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow');
          devUri = vscode.Uri.joinPath(devflowDir, 'DEV.md');
          devOutputPath = devUri.fsPath;
        }

        let devPrompt = buildDevPrompt(digContent, codebaseContext, data.digPath, devOutputPath);
        if (workspaceFolders && workspaceFolders.length > 0) {
          try {
            const templatePath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow', 'templates', 'dev.template.md');
            const templateData = await vscode.workspace.fs.readFile(templatePath);
            let customTemplate = Buffer.from(templateData).toString('utf8');
            customTemplate = customTemplate.replace(/\{\{digContent\}\}/g, () => digContent);
            customTemplate = customTemplate.replace(/\{\{codebaseContext\}\}/g, () => codebaseContext);
            devPrompt = customTemplate;
          } catch { /* use default */ }
        }

        workflowOutputs.dev = devPrompt;

        if (devUri && workspaceFolders && workspaceFolders.length > 0) {
          const devflowDir = vscode.Uri.joinPath(workspaceFolders[0].uri, '.devflow');
          let oldContent = '';
          try {
            oldContent = Buffer.from(await vscode.workspace.fs.readFile(devUri)).toString('utf8');
          } catch { /* no file */ }

          if (oldContent && oldContent !== devPrompt) {
            const tempOldUri = vscode.Uri.joinPath(devflowDir, 'DEV.old.md');
            await vscode.workspace.fs.writeFile(tempOldUri, Buffer.from(oldContent, 'utf8'));
            const tempNewUri = vscode.Uri.joinPath(devflowDir, 'DEV.new.md');
            await vscode.workspace.fs.writeFile(tempNewUri, Buffer.from(devPrompt, 'utf8'));
            vscode.commands.executeCommand('vscode.diff', tempOldUri, tempNewUri, 'DEV.md (Old vs New)');
          }

          await vscode.workspace.fs.writeFile(devUri, Buffer.from(devPrompt, 'utf8'));

          const sessionLogPath = vscode.Uri.joinPath(devflowDir, 'session.json');
          let sessionLogs: any[] = [];
          try {
            const currentLogs = await vscode.workspace.fs.readFile(sessionLogPath);
            sessionLogs = JSON.parse(currentLogs.toString());
          } catch { /* file doesn't exist yet */ }
          sessionLogs.push({ timestamp: new Date().toISOString(), step: 'DEV', input: data.digPath, output: 'DEV.md' });
          await vscode.workspace.fs.writeFile(sessionLogPath, Buffer.from(JSON.stringify(sessionLogs, null, 2), 'utf8'));
        }

        await vscode.env.clipboard.writeText(devPrompt);
        vscode.commands.executeCommand('workbench.action.chat.open', { query: devPrompt });

        sidebarProvider.postMessage({
          command: 'generationComplete',
          data: { step: 'dev', message: 'DEV Prompt sent to Chat. The AI will read DIG.md and maintain a session log in DEV.md.', promptContent: devPrompt },
        });
      } catch (error: any) {
        sidebarProvider.postMessage({ command: 'error', data: { message: error?.message || 'An unexpected error occurred' } });
      }
    }),

    vscode.commands.registerCommand('devflow.analyzeCodebase', async () => {
      const profile = await analyzer.analyze();
      const summary = analyzer.summarize(profile);
      sidebarProvider.postMessage({
        command: 'workspaceAnalysisResult',
        data: { result: summary }
      });
    }),

    vscode.commands.registerCommand('devflow.resetWorkflow', () => {
      workflowOutputs.story = undefined;
      workflowOutputs.prd = undefined;
      workflowOutputs.tds = undefined;
      workflowOutputs.dig = undefined;
      workflowOutputs.dev = undefined;
      sidebarProvider.postMessage({
        command: 'workflowReset',
        data: {}
      });
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
        const content = (workflowOutputs as any)[data.fileType];
        if (content) {
          const doc = await vscode.workspace.openTextDocument({ content: content, language: 'markdown' });
          vscode.window.showTextDocument(doc);
        } else {
          vscode.window.showErrorMessage(`Prompt not generated yet for: ${data.fileType}`);
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to open prompt: ${error.message}`);
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

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function deactivate(): void {
  // no-op
}

