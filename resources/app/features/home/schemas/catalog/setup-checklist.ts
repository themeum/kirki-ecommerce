import { z } from 'zod';

const SetupStepIdSchema = z.enum(['products', 'payments', 'tax', 'shipping']);

const SetupStepSchema = z.object({
  id: SetupStepIdSchema,
  is_completed: z.boolean(),
  is_preconfigured: z.boolean(),
  has_data: z.boolean(),
});

const SetupChecklistSchema = z.object({
  steps: z.array(SetupStepSchema),
});

type SetupStepId = z.infer<typeof SetupStepIdSchema>;
type SetupStep = z.infer<typeof SetupStepSchema>;
type SetupChecklist = z.infer<typeof SetupChecklistSchema>;

export { type SetupChecklist, SetupChecklistSchema, type SetupStep, type SetupStepId };
