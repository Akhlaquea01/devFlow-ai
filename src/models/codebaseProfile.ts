export interface CodebaseTechStack {
  languages: string[];
  frameworks: string[];
  buildTools: string[];
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | string;
}

export interface CodebaseStructure {
  directories: string[];
  files: string[];
}

export interface CodebasePatterns {
  hasTests: boolean;
  hasCI: boolean;
  hasDocker: boolean;
  hasEnvExample: boolean;
  isMonorepo: boolean;
}

export interface CodebaseProfile {
  rootPath: string;
  techStack: CodebaseTechStack;
  structure: CodebaseStructure;
  patterns: CodebasePatterns;
  timestamp: string;
}

