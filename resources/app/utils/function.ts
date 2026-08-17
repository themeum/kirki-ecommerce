/**
 * Shared do-nothing callback, for optional handler props that need a default.
 *
 * Prefer this over an inline `() => {}`: the identity is stable across renders,
 * so a default handler never invalidates a memoized child.
 */
const noop = (): void => undefined;

export { noop };
