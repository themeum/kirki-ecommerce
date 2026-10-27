const SHORTCODE_PATTERN = /\{([a-zA-Z0-9_]+)\}/g;

/**
 * Client-side mirror of the backend `ShortcodeParser`'s regex
 * (`app/Parsers/ShortcodeParser.php`, `/\{([a-zA-Z0-9_]+)\}/`) and matching
 * semantics: a recognized `{tag}` is replaced by its variable's value, an
 * unrecognized or nullish one is left as literal text. Keep both patterns
 * identical (see design.md's shortcode-drift risk note).
 */
export const interpolateShortcodes = (
  content: string,
  variables: Record<string, unknown>,
): string => {
  return content.replace(SHORTCODE_PATTERN, (match, tag: string) => {
    const value = variables[tag];

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return match;
  });
};
