export type Selection = {
  start: number;
  end: number;
};

export const slugToToken = (slug: string) => `{${slug.replace(/-/g, '_')}}`;

/**
 * Insert a token into a message at the given selection.
 *
 * Offsets are clamped because a stored selection can outlive a form reset
 * that shortened the message — slicing on a stale offset would silently
 * mangle the text. A null selection appends at the end.
 */
export const insertTokenAtCursor = (
  value: string,
  token: string,
  selection: Selection | null,
): { text: string; caret: number } => {
  const start = selection ? Math.min(Math.max(selection.start, 0), value.length) : value.length;
  const end = selection ? Math.min(Math.max(selection.end, start), value.length) : value.length;

  return {
    text: `${value.slice(0, start)}${token}${value.slice(end)}`,
    caret: start + token.length,
  };
};
