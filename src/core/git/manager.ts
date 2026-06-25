/**
 * Git integration tools
 */

import { SimpleGit, simpleGit } from 'simple-git';
import * as path from 'path';

export interface DiffAnalysis {
  filesChanged: number;
  insertions: number;
  deletions: number;
  changedFiles: string[];
  summary: string;
}

export interface CommitSuggestion {
  type: 'feat' | 'fix' | 'docs' | 'refactor' | 'test' | 'chore';
  title: string;
  description: string;
}

/**
 * Git manager
 */
export class GitManager {
  private git: SimpleGit;

  constructor(repoPath: string = process.cwd()) {
    this.git = simpleGit(repoPath);
  }

  /**
   * Analyze git diff
   */
  async analyzeDiff(from: string = 'HEAD~1', to: string = 'HEAD'): Promise<DiffAnalysis> {
    try {
      const diff = await this.git.diff([`${from}...${to}`]);
      const summary = await this.git.diffSummary([`${from}...${to}`]);

      const changedFiles = summary.files.map((f) => f.file);

      return {
        filesChanged: summary.files.length,
        insertions: summary.insertions,
        deletions: summary.deletions,
        changedFiles,
        summary: diff.substring(0, 500),
      };
    } catch (error) {
      throw new Error(`Failed to analyze diff: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate commit message suggestion
   */
  async suggestCommitMessage(): Promise<CommitSuggestion> {
    try {
      const status = await this.git.status();
      const diff = await this.git.diff();

      // Simple heuristic - in real implementation, use AI
      const hasTests = diff.includes('test') || diff.includes('spec');
      const hasFixes = diff.includes('fix') || diff.includes('bug');
      const hasFeatures = diff.includes('new') || diff.includes('add');

      let type: 'feat' | 'fix' | 'docs' | 'refactor' | 'test' | 'chore' = 'chore';
      if (hasTests) type = 'test';
      if (hasFixes) type = 'fix';
      if (hasFeatures) type = 'feat';

      return {
        type,
        title: `${type}: ${status.files.length} files changed`,
        description: `Modified ${status.files.length} files with ${diff.length} characters of changes`,
      };
    } catch (error) {
      throw new Error(`Failed to suggest commit message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current branch
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const result = await this.git.revparse(['--abbrev-ref', 'HEAD']);
      return result.trim();
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get commit history
   */
  async getHistory(count: number = 10) {
    try {
      const log = await this.git.log([`-n${count}`]);
      return log.all;
    } catch (error) {
      throw new Error(`Failed to get history: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
