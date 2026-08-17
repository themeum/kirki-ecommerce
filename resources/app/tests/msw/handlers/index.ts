import type { RequestHandler } from 'msw';

/**
 * Aggregates per-feature handler files (e.g. `./settings.ts`), following the
 * same one-file-per-resource convention as `services/`. Empty until a
 * feature's service layer gets MSW coverage.
 */
export const handlers: RequestHandler[] = [];
