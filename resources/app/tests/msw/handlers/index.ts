import type { RequestHandler } from 'msw';

import { handlers as mediaHandlers } from './media';

/**
 * Aggregates per-feature handler files (e.g. `./media.ts`), following the
 * same one-file-per-resource convention as `services/`.
 */
export const handlers: RequestHandler[] = [...mediaHandlers];
