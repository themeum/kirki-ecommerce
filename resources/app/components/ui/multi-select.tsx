import { type CSSObject } from '@emotion/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Command as CommandPrimitive } from 'cmdk';
import { Plus, X } from 'lucide-react';
import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import Chip from '@/components/ui/chip';
import { chipFieldControlCss } from '@/components/ui/chip-field-styles';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { countChipsWithinRows } from '@/components/ui/multi-select-rows';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { theme } from '@/theme';
import { defineStyles, itemCenter, scoped, scopedMerge, uiFocusRing } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

/**
 * Minimum shape every option must satisfy. `title` backs the default
 * rendering and the search filter; `value` backs the default identity.
 */
type MultiSelectOption = {
  value: string | number;
  title: string;
};

// Fixed so the virtualizer's estimate is exact: it positions rows from this
// value alone, and a row that measured taller would overlap the next one.
const VIRTUAL_ROW_HEIGHT = 32;

type MultiSelectBaseProps<TOption extends MultiSelectOption> = {
  options: TOption[];
  value: TOption[];
  onChange: (next: TOption[]) => void;
  /** Identity of an option. Defaults to `String(option.value)`. */
  getOptionId?: (option: TOption) => string;
  /**
   * Renders an option's content inside a list row. Everything beyond the
   * plain title — a colour swatch, a thumbnail, a path — is composed in here
   * so this component never needs to learn about it.
   */
  renderOption?: (option: TOption) => ReactNode;
  /** Renders a selected option's content inside its chip. */
  renderChip?: (option: TOption) => ReactNode;
  /**
   * Extra style for an option's own row. The render slots compose content
   * after the checkbox, so anything that has to carry the checkbox with it
   * — a tree indent, for one — belongs here instead of in `renderOption`.
   *
   * Inline rather than a `css` object because what it carries is computed
   * per option at runtime, which is what the `style` prop is for.
   */
  optionStyle?: (option: TOption) => CSSProperties | undefined;
  /**
   * Holds at most one option. Choosing replaces whatever was held and
   * closes the panel; the held chip takes the whole row and the text
   * cursor is withdrawn until it is removed.
   */
  single?: boolean;
  /**
   * Hands the search text to the caller so it can supply matching options
   * itself. Supplying it also turns off cmdk's own filtering — the caller's
   * results are already filtered, and cmdk would otherwise filter matches on
   * anything outside `title` (an email, a SKU, a category's ancestors) back
   * out again.
   */
  onSearchChange?: (query: string) => void;
  /**
   * Called with the trimmed search text when the create row is chosen. If it
   * returns a promise, the create row stays pending until it settles; the
   * search text is only cleared once it resolves — so a failed create leaves
   * what the user typed in place. Either way the panel stays open.
   */
  onCreate?: (query: string) => void | Promise<void>;
  /**
   * Replaces the option list and the create row for as long as it is
   * supplied, for a field that needs to ask a follow-up question in place.
   * The panel stays open and cmdk does not act on keys pressed inside it.
   */
  panel?: ReactNode;
  placeholder?: string;
  /** Placeholder used once something is selected, where the long one no longer fits. */
  selectedPlaceholder?: string;
  emptyText?: string;
  /**
   * Replaces the option list and create row for as long as there is nothing
   * to pick from and nothing typed yet — e.g. before a single category
   * exists. Falls back to the normal search/create flow once a query is
   * typed, since that no longer means "nothing exists", just "no match yet".
   */
  emptyStateText?: string;
  disabled?: boolean;
  error?: boolean;
  cssOverride?: CSSObject;
  listCss?: CSSObject;
  /**
   * Virtualizes the option list instead of mounting every row, for a list
   * large enough that mounting it all would be slow. Requires the caller to
   * hand over an already filtered, already sorted `options` — cmdk's own
   * filtering and DOM sort would otherwise fight the virtualizer's absolute
   * positioning — which in practice means pairing it with `onSearchChange`.
   * Each row is single-lined and ellipsis-truncated, since the virtualizer
   * positions rows from a fixed height.
   */
  virtualized?: boolean;
  /**
   * Pinned below the scrollable option list, so it stays visible however far
   * the list is filtered or scrolled. Supplying it hides the built-in create
   * row: the footer owns that action, calling `create` to run `onCreate`
   * with the typed text exactly as the create row would. Enter still creates.
   */
  footer?: (state: { query: string; create: () => void }) => ReactNode;
};

/**
 * Caps how many chips render. Past the cap the rest collapse behind a
 * "+N more" control that expands them and offers a way back. Left out,
 * every chip renders and the row wraps.
 *
 * The cap is a count of chips or a count of rendered rows — two spellings of
 * one rule, so a field sets one or the other. A row cap has to be measured,
 * so only fields that ask for one pay for the measurement.
 */
type ChipCapProps =
  | { maxVisibleChips?: number; maxVisibleRows?: never }
  | { maxVisibleChips?: never; maxVisibleRows?: number };

type MultiSelectProps<TOption extends MultiSelectOption> = MultiSelectBaseProps<TOption> &
  ChipCapProps;

/**
 * Multi-select field: a bordered box whose chips and text cursor share one
 * wrapping row, with the option list dropping beneath it.
 *
 * Owns behaviour only — search, open state, selection, removal, chip
 * capping and the create row. Presentation of an option is supplied by the
 * caller through `renderOption` / `renderChip`.
 *
 * @param props Component props.
 *
 * @returns MultiSelect element.
 * @since 1.0.0
 */
const MultiSelect = <TOption extends MultiSelectOption>({
  options,
  value,
  onChange,
  getOptionId = (option) => String(option.value),
  renderOption = (option) => option.title,
  renderChip = (option) => option.title,
  optionStyle,
  maxVisibleChips,
  maxVisibleRows,
  single = false,
  onSearchChange,
  onCreate,
  panel,
  placeholder = __('Type to search..', 'kirki-ecommerce'),
  selectedPlaceholder,
  emptyText = __('No results found.', 'kirki-ecommerce'),
  emptyStateText,
  disabled = false,
  error = false,
  cssOverride,
  listCss,
  virtualized = false,
  footer,
}: MultiSelectProps<TOption>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [boxWidth, setBoxWidth] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const passRef = useRef(0);
  const measuredRef = useRef('');
  // A callback ref, not `useRef`: Radix mounts the popover's content in its
  // own commit without re-rendering this component, so a ref object would
  // still read null when the virtualizer's layout effect resolves the scroll
  // element. Storing the node in state re-renders us so it picks it up.
  const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
  const isPanelOpen = isOpen || Boolean(panel);

  const selectedIds = new Set(value.map(getOptionId));
  // A held single value leaves nothing to type against, so the cursor goes
  // away and the chip takes the row it was sharing.
  const isSingleHeld = single && value.length > 0;
  const trimmedSearch = search.trim();
  const exactMatch = options.find(
    (option) => option.title.toLowerCase() === trimmedSearch.toLowerCase(),
  );
  const canCreateQuery = Boolean(onCreate) && trimmedSearch.length > 0 && !exactMatch;
  // Nothing to pick and nothing typed reads the same whether the option list
  // is empty because nothing exists yet or because an empty search matches
  // everything — either way there is nothing to show.
  const hasNoOptions = options.length === 0 && !trimmedSearch;

  const virtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => listElement,
    estimateSize: () => VIRTUAL_ROW_HEIGHT,
    // Load-bearing for keyboard navigation, not just paint smoothness: cmdk
    // moves selection between mounted rows only, so this buffer is what an
    // arrow key past the viewport lands on before its scroll mounts the next
    // batch.
    overscan: 10,
    getItemKey: (index) => getOptionId(options[index]),
    // Assumed size until the ResizeObserver reports the real one — avoids a
    // flash of zero rows on first paint, and (as a side effect) means jsdom,
    // which never fires ResizeObserver callbacks, still has rows to interact
    // with in tests.
    initialRect: { width: 320, height: 240 },
  });

  // Without this, narrowing a list the merchant has scrolled down leaves them
  // staring at a blank region past the end of the shorter result set.
  useEffect(() => {
    if (!virtualized || !listElement) {
      return;
    }

    listElement.scrollTop = 0;
  }, [search, virtualized, listElement]);

  // Both caps collapse to one number here, so everything downstream — the
  // slice, the counter, the expand and collapse controls — is shared. A row
  // cap contributes nothing until it has been measured, and that first
  // unmeasured render is what the measurement reads.
  const effectiveCap =
    maxVisibleChips ?? (maxVisibleRows !== undefined ? (rowCount ?? undefined) : undefined);
  const isCapped = effectiveCap !== undefined && value.length > effectiveCap;
  // Derived rather than reset in an effect: a selection that falls back
  // within the cap has nothing left to expand, so the flag stops counting.
  const isShowingAll = isExpanded && isCapped;
  const visibleChips = isCapped && !isShowingAll ? value.slice(0, effectiveCap) : value;
  const hiddenCount = value.length - visibleChips.length;

  // Only a row-capped field pays for an observer. Width is held in state
  // rather than read during measurement so that a resize re-runs the
  // measurement rather than silently leaving a stale cut in place.
  useLayoutEffect(() => {
    if (maxVisibleRows === undefined) {
      return;
    }

    const node = boxRef.current;

    if (!node) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setBoxWidth(entry.contentRect.width);
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [maxVisibleRows]);

  // Runs after layout but before paint, so chips cut from the row are never
  // shown. Deliberately has no dependency array: the second pass has to read
  // a DOM that only exists once the first pass's result has rendered. The
  // recursion the rule warns about is bounded by `passRef`, and settles
  // sooner because React skips a re-render when both passes agree.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (maxVisibleRows === undefined || isShowingAll) {
      return;
    }

    const key = `${maxVisibleRows}|${value.length}|${boxWidth}`;

    if (measuredRef.current !== key) {
      measuredRef.current = key;
      passRef.current = 0;
      setRowCount(null);
      return;
    }

    // Rendering the counter consumes width on the last visible row and can
    // push the chip before it onto the next one, which changes the answer.
    // A second pass reads the row with the counter in place; past that the
    // frames cost more than the precision is worth, so the tighter of the
    // two cuts wins.
    if (passRef.current >= 2) {
      return;
    }

    passRef.current += 1;

    const tops = Array.from(
      chipsRef.current?.querySelectorAll<HTMLElement>('[data-chip]') ?? [],
    ).map((chip) => chip.offsetTop);
    const fitted = countChipsWithinRows(tops, maxVisibleRows);

    setRowCount((previous) => (previous === null ? fitted : Math.min(previous, fitted)));
  });

  const handleToggle = (option: TOption) => {
    if (single) {
      onChange([option]);
      setSearch('');
      onSearchChange?.('');
      setIsOpen(false);
      return;
    }

    const id = getOptionId(option);

    if (selectedIds.has(id)) {
      onChange(value.filter((item) => getOptionId(item) !== id));
      return;
    }

    onChange([...value, option]);
    setSearch('');
    onSearchChange?.('');
  };

  const handleRemove = (option: TOption) => {
    if (disabled) {
      return;
    }

    const id = getOptionId(option);
    onChange(value.filter((item) => getOptionId(item) !== id));
  };

  const handleCreate = async () => {
    if (!onCreate || isCreating) {
      return;
    }

    const result = onCreate(trimmedSearch);

    // No promise means the caller took over — its own panel content or a
    // dialog. The typed text has been handed over, so the input is cleared
    // and the panel is left for the caller to replace or for focus to close.
    if (!(result instanceof Promise)) {
      setSearch('');
      onSearchChange?.('');
      return;
    }

    // A promise means the caller is persisting something: hold the panel
    // open with the typed text until it settles, so a rejection is recoverable.
    setIsCreating(true);
    try {
      await result;
    } catch {
      return;
    } finally {
      setIsCreating(false);
    }

    setSearch('');
    onSearchChange?.('');
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !search && value.length > 0) {
      handleRemove(value[value.length - 1]);
      return;
    }

    if (event.key !== 'Enter' && event.key !== ',') {
      return;
    }

    if (event.key === ',') {
      event.preventDefault();

      if (exactMatch) {
        handleToggle(exactMatch);
        return;
      }
    }

    if (!canCreateQuery) {
      return;
    }

    // cmdk marks the row Enter would choose with `aria-selected`. While one
    // is marked that choice stands and nothing is created; only a query that
    // leaves the list empty falls through to the create row, which sits
    // outside the list and so can never be the marked row itself.
    if (
      event.key === 'Enter' &&
      contentRef.current?.querySelector('[cmdk-item][aria-selected="true"]')
    ) {
      return;
    }

    event.preventDefault();
    void handleCreate();
  };

  const handleBoxClick = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled || (event.target as HTMLElement).closest('button')) {
      return;
    }

    inputRef.current?.focus();
    setIsOpen(true);
  };

  const stopKeys = (event: KeyboardEvent<HTMLElement>) => event.stopPropagation();

  return (
    // cmdk owns arrow-key navigation and, unless the caller filters, the
    // filtering too. Its keydown handler sits on this root, so the input has
    // to be a DOM descendant of it; the list may be portalled away since
    // cmdk looks items up through the list ref.
    <Command shouldFilter={!onSearchChange && !virtualized} cssOverride={styles.command}>
      <Popover open={isPanelOpen} onOpenChange={setIsOpen}>
        <PopoverAnchor asChild>
          <div
            ref={boxRef}
            role="presentation"
            data-error={error ? 'true' : undefined}
            data-disabled={disabled ? 'true' : undefined}
            css={scopedMerge(styles.box, isSingleHeld && styles.boxFilled, cssOverride)}
            onClick={handleBoxClick}
          >
            {/* The chips sit inside cmdk's root, whose keydown handler
                preventDefaults Enter to select the active option. Stop here
                so Enter still activates a chip's own control. `display:
                contents` keeps them flex children of the box. */}
            <div
              ref={chipsRef}
              role="presentation"
              css={scoped(styles.chipsGuard)}
              onKeyDown={stopKeys}
            >
              {visibleChips.map((option) => (
                <Chip
                  key={getOptionId(option)}
                  data-chip=""
                  text={renderChip(option)}
                  gap={1}
                  cssOverride={single ? styles.chipSingle : styles.chip}
                  closeIcon={<X size={12} aria-hidden="true" />}
                  onRemove={() => handleRemove(option)}
                />
              ))}
              {isCapped && !isShowingAll && (
                <Button
                  variant="link"
                  cssOverride={styles.moreButton}
                  onClick={() => setIsExpanded(true)}
                >
                  {sprintf(__('+%d more', 'kirki-ecommerce'), hiddenCount)}
                </Button>
              )}
              {isShowingAll && (
                <Button
                  variant="link"
                  cssOverride={styles.moreButton}
                  onClick={() => setIsExpanded(false)}
                >
                  {__('Show less', 'kirki-ecommerce')}
                </Button>
              )}
            </div>
            {!isSingleHeld && (
              <CommandPrimitive.Input
                ref={inputRef}
                value={search}
                disabled={disabled}
                placeholder={value.length > 0 ? (selectedPlaceholder ?? placeholder) : placeholder}
                css={scoped(styles.input)}
                onKeyDown={handleInputKeyDown}
                onValueChange={(nextValue) => {
                  setSearch(nextValue);
                  onSearchChange?.(nextValue);

                  if (!isOpen) {
                    setIsOpen(true);
                  }
                }}
              />
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          ref={contentRef}
          align="start"
          sideOffset={4}
          cssOverride={styles.content}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (boxRef.current?.contains(event.target as Node)) {
              event.preventDefault();
            }
          }}
        >
          {panel ? (
            <div role="presentation" css={scoped(styles.panel)} onKeyDown={stopKeys}>
              {panel}
            </div>
          ) : emptyStateText && hasNoOptions ? (
            <div css={scoped(styles.emptyState)}>{emptyStateText}</div>
          ) : (
            <>
              {!footer && canCreateQuery && (
                <div css={scoped(styles.createHeader)}>
                  <Button
                    variant="tertiary"
                    disabled={isCreating}
                    cssOverride={styles.createButton}
                    onClick={() => {
                      void handleCreate();
                    }}
                  >
                    <Plus size={16} aria-hidden="true" />
                    {sprintf(__('Add "%s"', 'kirki-ecommerce'), trimmedSearch)}
                  </Button>
                </div>
              )}
              <CommandList ref={setListElement} cssOverride={listCss}>
                {/* With `shouldFilter={false}` cmdk cannot tell an empty
                    result from a list it never scored, so the virtualized
                    path resolves the empty state itself instead. */}
                {virtualized
                  ? options.length === 0 && (
                      <div css={scoped(styles.emptyState)}>{emptyText}</div>
                    )
                  : <CommandEmpty>{emptyText}</CommandEmpty>}
                {virtualized ? (
                  options.length > 0 && (
                    <div
                      style={{
                        height: virtualizer.getTotalSize(),
                        position: 'relative',
                        width: '100%',
                      }}
                    >
                      {virtualizer.getVirtualItems().map((virtualRow) => {
                        const option = options[virtualRow.index];
                        const id = getOptionId(option);

                        return (
                          <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            css={scoped(styles.virtualRow)}
                            style={{ transform: `translateY(${virtualRow.start}px)` }}
                          >
                            <CommandItem
                              value={option.title}
                              style={optionStyle?.(option)}
                              cssOverride={styles.virtualItem}
                              onSelect={() => handleToggle(option)}
                            >
                              {!single && (
                                <Checkbox
                                  checked={selectedIds.has(id)}
                                  tabIndex={-1}
                                  aria-hidden="true"
                                  cssOverride={styles.checkbox}
                                />
                              )}
                              <span css={scoped(styles.virtualLabel)}>{renderOption(option)}</span>
                            </CommandItem>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <CommandGroup>
                    {options.map((option) => {
                      const id = getOptionId(option);

                      return (
                        <CommandItem
                          key={id}
                          value={option.title}
                          style={optionStyle?.(option)}
                          onSelect={() => handleToggle(option)}
                        >
                          {/* A checkbox offers a selection that combines with
                              the ones beside it, which a single value cannot. */}
                          {!single && (
                            <Checkbox
                              checked={selectedIds.has(id)}
                              tabIndex={-1}
                              aria-hidden="true"
                              cssOverride={styles.checkbox}
                            />
                          )}
                          {renderOption(option)}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </>
          )}
          {!panel && footer && (
            <div css={scoped(styles.footer)}>
              {footer({ query: trimmedSearch, create: () => void handleCreate() })}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </Command>
  );
};

MultiSelect.displayName = 'MultiSelect';

export default MultiSelect;
export type { ChipCapProps, MultiSelectBaseProps, MultiSelectOption, MultiSelectProps };

const styles = defineStyles({
  command: {
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  box: {
    ...itemCenter(),
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: theme.spacing[1],
    width: '100%',
    // Matches `Input`, and matches it the same way: the minimum sits above
    // the content rather than pinning it, so both keep their resting height
    // if the type scale moves. Chips are taller than a bare line, so a
    // filled box grows past this.
    minHeight: '32px',
    padding: `${theme.spacing[1]} ${theme.spacing[1]}`,
    border: `1px solid ${theme.colors.border.secondary}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    cursor: 'text',
    '&:focus-within': {
      borderColor: theme.colors.background.fillBrand,
      ...uiFocusRing(theme),
    },
    '&[data-error="true"]': {
      borderColor: theme.colors.background.fillCritical,
      '&:focus-within': {
        borderColor: theme.colors.background.fillCritical,
      },
    },
    '&[data-disabled="true"]': {
      backgroundColor: theme.colors.background.surfaceAlt,
      opacity: 0.8,
      cursor: 'not-allowed',
    },
  },
  boxFilled: {
    cursor: 'pointer',
  },
  // Keeps the chips and the overflow control as flex children of the box
  // while still giving their keydown a place to stop.
  chipsGuard: {
    display: 'contents',
  },
  chip: {
    maxWidth: '100%',
    minWidth: 0,
  },
  // The held value owns the row, so the chip stretches to the box and its
  // remove control settles against the trailing edge. Chip's own close
  // button zeroes its margins, so the gap is opened from the row instead.
  chipSingle: {
    flex: 1,
    minWidth: 0,
    '& > div': {
      width: '100%',
      justifyContent: 'space-between',
    },
  },
  moreButton: {
    height: 'auto',
    padding: 0,
    ...theme.typography.small('medium'),
    color: theme.colors.text.emphasis,
    '&:hover': {
      textDecoration: 'none',
    },
  },
  input: {
    ...chipFieldControlCss,
    flex: 1,
    width: 'auto',
    minWidth: '80px',
    // `chipFieldControlCss` fixes the control at 32px for a field that owns
    // its own box. Here the box sets the height, so the input is left at
    // its own line height and capped only so a chip beside it stays the
    // tallest thing on the row.
    minHeight: 0,
    maxHeight: '24px',
    padding: `0 ${theme.spacing[1]}`,
  },
  footer: {
    flexShrink: 0,
    padding: theme.spacing[1],
    borderTop: `1px solid ${theme.colors.border.default}`,
  },
  content: {
    minWidth: 'var(--radix-popover-trigger-width)',
    maxWidth: 'var(--radix-popover-trigger-width)',
    padding: 0,
    overflow: 'hidden',
    borderRadius: theme.radius.lg,
  },
  // The row is the click target, so the checkbox only reports state.
  checkbox: {
    flexShrink: 0,
    pointerEvents: 'none',
  },
  createHeader: {
    padding: theme.spacing[1],
  },
  createButton: {
    justifyContent: 'flex-start',
    width: '100%',
    height: 'auto',
    gap: theme.spacing[2],
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    borderRadius: theme.radius.md,
    ...theme.typography.small('medium'),
  },
  panel: {
    padding: theme.spacing[3],
  },
  emptyState: {
    padding: `${theme.spacing[6]} ${theme.spacing[3]}`,
    textAlign: 'center',
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
  },
  virtualRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  // Fixed height keeps the virtualizer's estimate exact; the label beside it
  // is clipped rather than wrapped, since a second line would desynchronise
  // every offset below it.
  virtualItem: {
    height: `${VIRTUAL_ROW_HEIGHT}px`,
    minHeight: `${VIRTUAL_ROW_HEIGHT}px`,
    boxSizing: 'border-box',
  },
  virtualLabel: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
