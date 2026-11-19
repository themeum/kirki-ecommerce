## 1. Ghost hover highlight (first version, replaced by group 3)

- [x] 1.1 In `resources/app/components/ui/stacked-items.tsx`, in `styles.ghostContainer`, replace the row `&:hover` background with a `&:hover::before` highlight: `content: '""'`, `position: 'absolute'`, `inset: ${theme.spacing[1]} -${theme.spacing[2]}`, `borderRadius: theme.radius.lg`, the existing hover color (keep the `@todo` comment), `pointerEvents: 'none'`, `zIndex: -1` (design D1) — replaced by 3.2; the user did not accept the inset highlight
- [x] 1.2 In the same ghost row selector, add `isolation: 'isolate'` so the `::before` highlight paints behind the row content and not behind the card (design D1) — removed by 3.2
- [x] 1.3 Make sure the row box shows no background on hover in the ghost variant, including when the row renders as an anchor (override `Item`'s `a&:hover` background with a selector of higher specificity) (design D4) — replaced by 3.2; the row box now carries the hover color
- [x] 1.4 Confirm that the `outline` and `card` variants keep the `styles.row` hover background (no change to `styles.row`)
- [x] 1.5 Run `npm run typecheck && npm test` in `resources/app/` — done; same 2 typecheck errors (`features/orders/pages/orders.tsx` TS6133) and 4 test failures (orders-attention, first-sale-card, customize-sheet) occur without this change, so they are not caused by it

## 2. Verification (first version)

- [x] 2.1 Run `npm run lint` in `resources/app/` and fix new issues in `stacked-items.tsx` only
- [x] 2.2 Ask the user to check visually — done; the user asked for the full-width behaviour in group 3
- [x] 2.3 Run `npm run typecheck && npm test` in `resources/app/` — done; same pre-existing failures as 1.5

## 3. Full-row ghost highlight with growing dividers

- [x] 3.1 In `resources/app/components/ui/card.tsx`, add `'--stacked-items-bleed': theme.spacing[4]` to `styles.card` (design D2)
- [x] 3.2 In `stacked-items.tsx`, change `styles.ghostContainer`: container `marginInline: calc(-1 * var(--stacked-items-bleed, spacing[2]))` with no inline padding; ghost row `paddingInline: var(--stacked-items-bleed, spacing[2])` and `&:hover` with the existing hover color; remove the `::before` highlight and `isolation` from group 1 (design D1)
- [x] 3.3 Change the ghost focus ring to `inset: 0` and no border radius (design D4)
- [x] 3.4 Add `data-slot="stacked-item-wrapper"` to the row wrapper div. In the ghost variant, make the wrapper border transparent, draw the divider on the wrapper `::after` (`bottom: -1px`, `left`/`right` equal to the bleed, transition on `left` and `right`), and set `left`/`right` to `0` for a hovered or focus-visible wrapper and for the wrapper before it (design D3) — the transparent border sits under `&:not(:last-of-type)` to beat the wrapper border rule (equal specificity otherwise)
- [x] 3.5 Run `npm run typecheck && npm test` and ESLint on the changed files in `resources/app/` — done; only the pre-existing failures from 1.5 remain

## 4. Verification

- [x] 4.1 Ask the user to check visually (no browser preview per CLAUDE.md) the four home cards: the hover fills the row from card edge to card edge and full height, the content does not move, the dividers above and below grow with a transition and shrink back, the focus ring has the hover shape, and the row heights do not change — done; the user checked it
- [x] 4.2 Run `npm run typecheck && npm test` in `resources/app/` — done; only the pre-existing failures from 1.5 remain
