/**
 * Agent architecture - Planner, Executor, Tool, Memory, Verifier
 */

import { ChatMessage, ChatResponse } from '../providers/base';
import { router, RouteOptions } from '../router';
import { toolRegistry, ToolDefinition } from '../tools/registry';
import { memoryManager } from '../memory/manager';

export interface AgentTask {
  id: string;
  objective: string;
  context?: string;
  constraints?: string[];
  tools?: string[];
}

export interface AgentPlan {
  taskId: string;
  steps: AgentStep[];
  estimatedTokens: number;
  reasoning: string;
}

export interface AgentStep {
  id: string;
  action: 'think' | 'tool' | 'refine';
  description: string;
  toolName?: string;
  toolInput?: Record<string, any>;
  expectedOutput?: string;
}

export interface ExecutionResult {
  stepId: string;
  status: 'success' | 'error' | 'blocked';
  output?: any;
  error?: string;
  tokensUsed?: number;
}

/**
 * Planner Agent - breaks down objectives into actionable steps
 */
export class PlannerAgent {
  async plan(task: AgentTask, options?: RouteOptions): Promise<AgentPlan> {
    const prompt = this.buildPrompt(task);
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert planning agent. Break down complex objectives into clear, actionable steps.
        Respond with a JSON object containing: { "steps": [{"action": "think|tool|refine", "description": "...", "toolName": "..." (if tool), "expectedOutput": "..."}], "reasoning": "..." }`,
      },
      { role: 'user', content: prompt },
    ];

    const response = await router.chat(messages, options);

    try {
      const parsed = JSON.parse(response.content);
      const steps: AgentStep[] = parsed.steps.map((s: any, i: number) => ({
        id: `step-${i}`,
        action: s.action,
        description: s.description,
        toolName: s.toolName,
        toolInput: s.toolInput,
        expectedOutput: s.expectedOutput,
      }));

      return {
        taskId: task.id,
        steps,
        estimatedTokens: response.tokens.total,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      throw new Error(`Failed to parse plan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildPrompt(task: AgentTask): string {
    let prompt = `Objective: ${task.objective}\n`;
    if (task.context) prompt += `Context: ${task.context}\n`;
    if (task.constraints?.length) {
      prompt += `Constraints:\n${task.constraints.map((c) => `- ${c}`).join('\n')}\n`;
    }
    if (task.tools?.length) {
      prompt += `Available Tools: ${task.tools.join(', ')}\n`;
    }
    return prompt;
  }
}

/**
 * Executor Agent - executes planned steps
 */
export class ExecutorAgent {
  async execute(
    step: AgentStep,
    context?: Record<string, any>,
    options?: RouteOptions
  ): Promise<ExecutionResult> {
    if (step.action === 'tool') {
      return this.executeTool(step);
    }

    if (step.action === 'think') {
      return this.executeThink(step, context, options);
    }

    return {
      stepId: step.id,
      status: 'error',
      error: `Unknown action: ${step.action}`,
    };
  }

  private async executeTool(step: AgentStep): Promise<ExecutionResult> {
    if (!step.toolName) {
      return {
        stepId: step.id,
        status: 'error',
        error: 'No tool name specified',
      };
    }

    const result = await toolRegistry.execute(step.toolName, step.toolInput || {});

    return {
      stepId: step.id,
      status: result.success ? 'success' : 'error',
      output: result.result,
      error: result.error,
    };
  }

  private async executeThink(step: AgentStep, context?: Record<string, any>, options?: RouteOptions): Promise<ExecutionResult> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a careful thinking agent. Provide a detailed analysis and reasoning.',
      },
      { role: 'user', content: step.description },
    ];

    try {
      const response = await router.chat(messages, options);
      return {
        stepId: step.id,
        status: 'success',
        output: response.content,
        tokensUsed: response.tokens.total,
      };
    } catch (error) {
      return {
        stepId: step.id,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Tool Agent - manages tool discovery and execution
 */
export class ToolAgent {
  async discoverTools(task: AgentTask): Promise<ToolDefinition[]> {
    const allTools = toolRegistry.list();

    if (!task.tools || task.tools.length === 0) {
      return allTools;
    }

    return allTools.filter((tool) => task.tools!.includes(tool.name));
  }

  async getTool(name: string): Promise<ToolDefinition | null> {
    return toolRegistry.get(name);
  }

  async listTools(category?: string): Promise<ToolDefinition[]> {
    if (category) {
      return toolRegistry.listByCategory(category);
    }
    return toolRegistry.list();
  }
}

/**
 * Memory Agent - manages context and learning
 */
export class MemoryAgent {
  async storeContext(context: string, tags: string[] = []): Promise<string> {
    return await memoryManager.savePersistent(context, tags);
  }

  async retrieveContext(query: string): Promise<string> {
    const results = await memoryManager.searchPersistent(query);
    return results.map((m) => m.content).join('\n---\n');
  }

  async storeSessionMemory(content: string, tags: string[] = []): Promise<void> {
    memoryManager.addSession(content, tags);
  }

  async getSessionMemory(): Promise<string> {
    const memories = memoryManager.getSession();
    return memories.map((m) => m.content).join('\n');
  }
}

/**
 * Verifier Agent - validates outputs and results
 */
export class VerifierAgent {
  async verify(
    output: any,
    expectedOutput: string,
    options?: RouteOptions
  ): Promise<{ isValid: boolean; confidence: number; feedback: string }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a verification agent. Analyze if the output matches the expected result. Respond with JSON: { "isValid": boolean, "confidence": 0-1, "feedback": "..." }',
      },
      {
        role: 'user',
        content: `Expected: ${expectedOutput}\n\nActual: ${JSON.stringify(output)}\n\nVerify if output meets expectations.`,
      },
    ];

    try {
      const response = await router.chat(messages, options);
      const parsed = JSON.parse(response.content);
      return parsed;
    } catch (error) {
      return {
        isValid: false,
        confidence: 0,
        feedback: `Verification failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
