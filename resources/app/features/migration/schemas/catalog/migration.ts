import { z } from 'zod';

const MigrationExtensionSchema = z.object({
  slug: z.string(),
  label: z.string(),
  status: z.enum(['supported', 'not_migrated']),
});

const MigrationSourceSchema = z.object({
  id: z.string(),
  label: z.string(),
  version: z.object({
    version: z.string().nullable(),
    minimum: z.string(),
    supported: z.boolean(),
  }),
  extensions: z.array(MigrationExtensionSchema).default([]),
});

const MigrationSourcesSchema = z.array(MigrationSourceSchema);

const MigrationGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().default(''),
  count: z.number(),
});

const MigrationScanSchema = z.object({
  source: z.string(),
  groups: z.array(MigrationGroupSchema).default([]),
  extensions: z.array(MigrationExtensionSchema).default([]),
});

const MigrationGroupStatusSchema = z.enum(['pending', 'running', 'failed', 'done']);

const MigrationGroupStateSchema = z.object({
  label: z.string(),
  status: MigrationGroupStatusSchema,
  cursor: z.number(),
  total: z.number(),
  done: z.number(),
  created: z.number(),
  reused: z.number(),
  skipped: z.number(),
});

const MigrationGroupStatesSchema = z.preprocess(
  (value) => (Array.isArray(value) ? {} : value),
  z.record(MigrationGroupStateSchema),
);

const MigrationSkippedItemSchema = z.object({
  group: z.string(),
  source_id: z.number(),
  reason: z.string(),
});

const MigrationRunStatusSchema = z.enum([
  'pending',
  'running',
  'failed',
  'done',
  'reverting',
  'reverted',
]);

const MigrationRevertProgressSchema = z.object({
  run_id: z.number(),
  status: MigrationRunStatusSchema,
  done: z.boolean(),
  total: z.number(),
  removed: z.number(),
  kept: z.number(),
});

const MigrationRunSchema = z.object({
  id: z.number(),
  source: z.string(),
  status: MigrationRunStatusSchema,
  groups: MigrationGroupStatesSchema,
  skipped_items: z.array(MigrationSkippedItemSchema).default([]),
  revert: MigrationRevertProgressSchema.optional(),
  last_error: z.string().nullable(),
});

const MigrationLatestRunSchema = MigrationRunSchema.nullable();

const MigrationProgressSchema = z.object({
  run_id: z.number(),
  status: MigrationRunStatusSchema,
  done: z.boolean(),
  group: z.string().nullable(),
  label: z.string().nullable(),
  range_from: z.number(),
  range_to: z.number(),
  group_finished: z.boolean(),
  groups: MigrationGroupStatesSchema,
  notes: z.array(z.string()).default([]),
});

type MigrationSource = z.infer<typeof MigrationSourceSchema>;
type MigrationExtension = z.infer<typeof MigrationExtensionSchema>;
type MigrationGroup = z.infer<typeof MigrationGroupSchema>;
type MigrationScan = z.infer<typeof MigrationScanSchema>;
type MigrationGroupState = z.infer<typeof MigrationGroupStateSchema>;
type MigrationSkippedItem = z.infer<typeof MigrationSkippedItemSchema>;
type MigrationRun = z.infer<typeof MigrationRunSchema>;
type MigrationProgress = z.infer<typeof MigrationProgressSchema>;
type MigrationRevertProgress = z.infer<typeof MigrationRevertProgressSchema>;

export {
  type MigrationExtension,
  type MigrationGroup,
  type MigrationGroupState,
  MigrationLatestRunSchema,
  type MigrationProgress,
  MigrationProgressSchema,
  type MigrationRevertProgress,
  MigrationRevertProgressSchema,
  type MigrationRun,
  MigrationRunSchema,
  type MigrationScan,
  MigrationScanSchema,
  type MigrationSkippedItem,
  type MigrationSource,
  MigrationSourcesSchema,
};
