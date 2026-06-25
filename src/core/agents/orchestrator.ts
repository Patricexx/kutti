/**
 * Agent orchestrator - coordinates multiple agents
 */

import { PlannerAgent, ExecutorAgent, ToolAgent, MemoryAgent, VerifierAgent, AgentTask, AgentPlan, ExecutionResult } from './index';
import { RouteOptions } from '../router';

export interface OrchestrationResult {
  taskId: string;
  status: 'success' | 'failed' | 'blocked';
  plan: AgentPlan;
  executions: ExecutionResult[];
  finalOutput?: any;
  totalTokens: number;
  duration: number;
}

/**
 * Agent Orchestrator - manages the workflow
 */
export class AgentOrchestrator {
  private planner = new PlannerAgent();
  private executor = new ExecutorAgent();
  private toolAgent = new ToolAgent();
  private memoryAgent = new MemoryAgent();
  private verifier = new VerifierAgent();

  /**
   * Execute a task end-to-end
   */
  async executeTask(task: AgentTask, options?: RouteOptions): Promise<OrchestrationResult> {
    const startTime = Date.now();
    let totalTokens = 0;
    const executions: ExecutionResult[] = [];

    try {
      // Phase 1: Plan
      console.log(`[Agent] Planning task: ${task.objective}`);
      const plan = await this.planner.plan(task, options);
      totalTokens += plan.estimatedTokens;

      // Phase 2: Store context
      await this.memoryAgent.storeSessionMemory(`Task: ${task.objective}`, ['task', 'planning']);

      // Phase 3: Execute steps
      let finalOutput: any = null;
      for (const step of plan.steps) {
        console.log(`[Agent] Executing step: ${step.description}`);

        const execution = await this.executor.execute(step, {}, options);
        executions.push(execution);

        if (execution.status === 'error') {
          console.error(`[Agent] Step failed: ${execution.error}`);
          throw new Error(`Step execution failed: ${execution.error}`);
        }

        finalOutput = execution.output;
        if (execution.tokensUsed) {
          totalTokens += execution.tokensUsed;
        }
      }

      // Phase 4: Verify results
      const lastStep = plan.steps[plan.steps.length - 1];
      if (lastStep.expectedOutput) {
        console.log(`[Agent] Verifying output...`);
        const verification = await this.verifier.verify(
          finalOutput,
          lastStep.expectedOutput,
          options
        );

        if (!verification.isValid && verification.confidence < 0.5) {
          throw new Error(`Verification failed: ${verification.feedback}`);
        }
      }

      // Phase 5: Store result
      await this.memoryAgent.storeSessionMemory(`Result: ${JSON.stringify(finalOutput)}`, ['result']);

      return {
        taskId: task.id,
        status: 'success',
        plan,
        executions,
        finalOutput,
        totalTokens,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        taskId: task.id,
        status: 'failed',
        plan: { taskId: task.id, steps: [], estimatedTokens: 0, reasoning: '' },
        executions,
        finalOutput: null,
        totalTokens,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get planner agent
   */
  getPlanner(): PlannerAgent {
    return this.planner;
  }

  /**
   * Get executor agent
   */
  getExecutor(): ExecutorAgent {
    return this.executor;
  }

  /**
   * Get tool agent
   */
  getToolAgent(): ToolAgent {
    return this.toolAgent;
  }

  /**
   * Get memory agent
   */
  getMemoryAgent(): MemoryAgent {
    return this.memoryAgent;
  }

  /**
   * Get verifier agent
   */
  getVerifier(): VerifierAgent {
    return this.verifier;
  }
}

export const orchestrator = new AgentOrchestrator();
