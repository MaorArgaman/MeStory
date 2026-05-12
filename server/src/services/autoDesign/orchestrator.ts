/**
 * Bounded loop:   planner → critic → (optional revision) → done.
 *
 * Hard limits:
 *   - Maximum 2 planner calls per generate (initial + 1 revision).
 *   - 1 critic call after the initial plan; if revision needed, no
 *     second critic call (the revision is trusted — the critic's job
 *     was to surface issues for the planner to fix, not to gate again).
 *   - No sub-agents talking to each other in a loop.
 *
 * The cap of 3 generates per book (auto_design_uses) lives one layer up
 * in the route's middleware, not here.
 */

import { IBook } from '../../models/Book';
import { DesignPlan } from './designPlanSchema';
import { planDesign, PlannerInput } from './plannerAgent';
import { critiquePlan } from './criticAgent';

export interface OrchestratorInput {
  book: IBook;
  attemptNumber: 1 | 2 | 3;
  previousSystems: string[];
  /** Optional progress callback — called as steps complete. The route
   *  forwards these to the client via SSE/polling. */
  onProgress?: (step: ProgressStep) => void;
}

export type ProgressStep =
  | { stage: 'planning' }
  | { stage: 'critiquing' }
  | { stage: 'revising' }
  | { stage: 'done'; designSystem: string };

export interface OrchestratorOutput {
  plan: DesignPlan;
  reasoning: string;
  /** True if the critic accepted on the first pass; false if a revision
   *  was needed. Useful for telemetry — high revision rate = planner
   *  prompt needs tuning. */
  passedFirstTry: boolean;
  /** Total tokens consumed across all planner calls. */
  totalTokens: { input: number; output: number };
}

export async function generateDesign(
  input: OrchestratorInput
): Promise<OrchestratorOutput> {
  const { book, attemptNumber, previousSystems, onProgress } = input;

  onProgress?.({ stage: 'planning' });

  const firstAttempt = await planDesign({
    book,
    attemptNumber,
    previousSystems,
  });

  onProgress?.({ stage: 'critiquing' });

  const critique = await critiquePlan({ book, plan: firstAttempt.plan });

  if (critique.pass) {
    onProgress?.({ stage: 'done', designSystem: firstAttempt.plan.designSystem });
    return {
      plan: firstAttempt.plan,
      reasoning: firstAttempt.reasoning,
      passedFirstTry: true,
      totalTokens: firstAttempt.usage,
    };
  }

  // Revision pass — feed the issues + prior plan back to the planner.
  onProgress?.({ stage: 'revising' });

  const revisionInput: PlannerInput = {
    book,
    attemptNumber,
    previousSystems,
    priorRevisionIssues: critique.issues,
    priorPlan: firstAttempt.plan,
  };
  const revised = await planDesign(revisionInput);

  onProgress?.({ stage: 'done', designSystem: revised.plan.designSystem });

  return {
    plan: revised.plan,
    reasoning: revised.reasoning,
    passedFirstTry: false,
    totalTokens: {
      input: firstAttempt.usage.input + revised.usage.input,
      output: firstAttempt.usage.output + revised.usage.output,
    },
  };
}
