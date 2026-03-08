import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { CodebaseProfile } from '../models/codebaseProfile';

export class CodebaseAnalyzer {
  private workspaceRoot: string;

  constructor() {
    const folders = vscode.workspace.workspaceFolders;
    this.workspaceRoot = folders?.[0]?.uri.fsPath || '';
  }

  async analyze(): Promise<CodebaseProfile> {
    const [techStack, structure, patterns, projectMeta] = await Promise.all([
      this.detectTechStack(),
      this.scanStructure(),
      this.detectPatterns(),
      this.readProjectMeta(),
    ]);

    return {
      rootPath: this.workspaceRoot,
      techStack,
      structure,
      patterns,
      projectMeta,
      timestamp: new Date().toISOString(),
    };
  }

  private async readProjectMeta(): Promise<{ name?: string; version?: string; description?: string }> {
    try {
      const pkgPath = require('path').join(this.workspaceRoot, 'package.json');
      const pkg = JSON.parse(await require('fs/promises').readFile(pkgPath, 'utf-8'));
      return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
      };
    } catch {
      return {};
    }
  }

  private async detectTechStack(): Promise<CodebaseProfile['techStack']> {
    const stack: CodebaseProfile['techStack'] = {
      languages: [],
      frameworks: [],
      buildTools: [],
      packageManager: 'npm',
    };

    const files: string[] = await fs.readdir(this.workspaceRoot).catch(() => []);
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
      if (allDeps['@types/vscode'] || allDeps['vscode']) {
        stack.frameworks.push('VS Code Extension API');
      }
      if (allDeps['webpack'] || allDeps['webpack-cli']) {
        stack.buildTools.push('Webpack');
      }
      if (allDeps['esbuild']) {
        stack.buildTools.push('esbuild');
      }
      if (allDeps['vite']) {
        stack.buildTools.push('Vite');
      }
      if (allDeps['mammoth']) {
        stack.frameworks.push('mammoth (DOCX parsing)');
      }
      if (allDeps['pdf-parse']) {
        stack.frameworks.push('pdf-parse (PDF parsing)');
      }
    } catch {
      // ignore
    }

    return stack;
  }

  private async scanStructure(dir?: string, depth = 0): Promise<CodebaseProfile['structure']> {
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
    const dirs: string[] = [];
    const files: string[] = [];

    for (const entry of entries) {
      if (ignore.has(entry.name)) {
        continue;
      }
      if (entry.isDirectory()) {
        dirs.push(entry.name);
      } else {
        files.push(entry.name);
      }
    }
    return { directories: dirs, files };
  }

  private async detectPatterns(): Promise<CodebaseProfile['patterns']> {
    return {
      hasTests:
        (await this.pathExists('test')) ||
        (await this.pathExists('__tests__')) ||
        (await this.pathExists('spec')),
      hasCI:
        (await this.pathExists('.github/workflows')) ||
        (await this.pathExists('.gitlab-ci.yml')),
      hasDocker:
        (await this.pathExists('Dockerfile')) ||
        (await this.pathExists('docker-compose.yml')),
      hasEnvExample:
        (await this.pathExists('.env.example')) ||
        (await this.pathExists('.env.sample')),
      isMonorepo:
        (await this.pathExists('lerna.json')) ||
        (await this.pathExists('pnpm-workspace.yaml')),
    };
  }

  private async collectFileExtensions(): Promise<Set<string>> {
    const exts = new Set<string>();
    const walk = async (dir: string, depth = 0) => {
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
        } else if (entry.isDirectory()) {
          await walk(path.join(dir, entry.name), depth + 1);
        }
      }
    };
    await walk(this.workspaceRoot);
    return exts;
  }

  private async pathExists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.workspaceRoot, relativePath));
      return true;
    } catch {
      return false;
    }
  }

  summarize(profile: CodebaseProfile): string {
    const lines: string[] = [];

    // Project identity from package.json
    if (profile.projectMeta) {
      const { name, version, description } = profile.projectMeta;
      lines.push('## Project Info');
      if (name) { lines.push(`- **Name**: ${name}`); }
      if (version) { lines.push(`- **Version**: ${version}`); }
      if (description) { lines.push(`- **Description**: ${description}`); }
      lines.push('');
    }

    lines.push(
      '## Codebase Profile',
      `- **Languages**: ${profile.techStack.languages.join(', ') || 'Unknown'}`,
      `- **Frameworks**: ${profile.techStack.frameworks.join(', ') || 'None detected'}`,
      `- **Build Tools**: ${profile.techStack.buildTools.join(', ') || 'None detected'}`,
      `- **Package Manager**: ${profile.techStack.packageManager}`,
      `- **Has Tests**: ${profile.patterns.hasTests ? 'Yes' : 'No'}`,
      `- **Has CI/CD**: ${profile.patterns.hasCI ? 'Yes' : 'No'}`,
      `- **Has Docker**: ${profile.patterns.hasDocker ? 'Yes' : 'No'}`,
      `- **Monorepo**: ${profile.patterns.isMonorepo ? 'Yes' : 'No'}`,
      `- **Top-level dirs**: ${profile.structure.directories.join(', ')}`,
    );
    return lines.join('\n');
  }
}

