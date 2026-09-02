import { formatLocalDate, parseUtcDate } from '../utils/date';

/**
 * Alpine directive: x-local-time
 * Formats UTC ISO strings or timestamps into the user's local timezone.
 *
 * Public API:
 *   x-local-time           -> "Sep 1, 2026, 11:30 AM" (default: datetime)
 *   x-local-time.date      -> "Sep 1, 2026"
 *   x-local-time.time      -> "11:30 AM"
 *   x-local-time.datetime  -> "Sep 1, 2026, 11:30 AM"
 */
export function registerLocalTimeDirective(Alpine: any): void {
  Alpine.directive(
    'local-time',
    (
      el: HTMLElement,
      { modifiers, expression }: { modifiers: string[]; expression: string },
      {
        evaluateLater,
        effect,
      }: {
        evaluateLater: (exp: string) => (cb: (val: any) => void) => void;
        effect: (fn: () => void) => void;
      },
    ) => {
      const mode = modifiers.includes('date')
        ? 'date'
        : modifiers.includes('time')
          ? 'time'
          : 'datetime';

      const update = (rawVal: unknown) => {
        const date = parseUtcDate(rawVal);
        if (date) {
          el.textContent = formatLocalDate(date, mode);
        }
      };

      if (expression) {
        const evaluate = evaluateLater(expression);
        effect(() => {
          evaluate((val: unknown) => update(val));
        });
      } else {
        update(el.textContent);
      }
    },
  );
}
