import * as vscode from 'vscode';
import * as path from 'path';
const pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';

export type InputSource = 'text' | 'clipboard' | 'jira' | 'file';

export interface ParsedRequirement {
  source: InputSource;
  title: string;
  rawContent: string;
  parsedContent: string;
  metadata: Record<string, string>;
}

export class RequirementParser {
  async parse(
    source: InputSource,
    requirement: string,
    attachedFiles: string[] = [],
    imageUrls: string[] = []
  ): Promise<ParsedRequirement> {
    let result = await this.getBaseParse(source, requirement);

    // Append attached files
    if (attachedFiles.length > 0) {
      result.parsedContent += '\n\n### Context Attachments:\n';
      for (const filePath of attachedFiles) {
        try {
          const content = await this.parseFileContent(filePath);
          const ext = path.extname(filePath).slice(1) || 'text';
          const filename = path.basename(filePath);

          result.parsedContent += `\n#### File: ${filename}\n\`\`\`${ext}\n${content}\n\`\`\`\n`;
        } catch (error: any) {
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

  private async getBaseParse(source: InputSource, requirement: string): Promise<ParsedRequirement> {
    if (source === 'file') {
      return this.parseFromFile(requirement);
    } else if (source === 'jira') {
      return this.parseFromJira(requirement);
    }
    return this.parseFromText(source, requirement);
  }

  private async parseFromText(source: InputSource, text: string): Promise<ParsedRequirement> {
    return {
      source,
      title: text.split('\n')[0]?.substring(0, 80) || 'Untitled',
      rawContent: text,
      parsedContent: text,
      metadata: {},
    };
  }

  private async parseFileContent(filePath: string): Promise<string> {
    const fileUri = vscode.Uri.file(filePath);
    const data = await vscode.workspace.fs.readFile(fileUri);
    const buffer = Buffer.from(data);
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    } else if (ext === '.docx') {
      const docxData = await mammoth.extractRawText({ buffer: buffer });
      return docxData.value;
    } else {
      return buffer.toString('utf8');
    }
  }

  private async parseFromFile(filePath: string): Promise<ParsedRequirement> {
    try {
      let absolutePath = filePath;
      if (!path.isAbsolute(filePath)) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          absolutePath = path.join(workspaceFolders[0].uri.fsPath, filePath);
        }
      }

      const content = await this.parseFileContent(absolutePath);

      return {
        source: 'file',
        title: path.basename(filePath),
        rawContent: content,
        parsedContent: content,
        metadata: { filePath: absolutePath },
      };
    } catch (error: any) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  private async parseFromJira(ticketId: string): Promise<ParsedRequirement> {
    return {
      source: 'jira',
      title: `Jira Ticket: ${ticketId.substring(0, 80)}`,
      rawContent: ticketId,
      parsedContent: `Fetch the Jira issue ${ticketId} using MCP tools to get the full story context.`,
      metadata: { ticketId },
    };
  }
}

