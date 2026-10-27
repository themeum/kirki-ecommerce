## 1. EmptyState primitive

- [x] 1.1 Create `resources/app/components/ui/empty-state.tsx` with props
  `{ icon?: ReactNode; text: string; cssOverride?: CSSObject }`, rendering
  `Card(cardStyles.innerDarkCard) > CardContent(innerDarkContent + vertical padding) > Flex column gap={2} align="center"` with the icon and a subdued `Text`. Follow primitive
  conventions: `scopedMerge`, `displayName`, default export, `styles` at file bottom.
- [x] 1.2 Run `npm run typecheck && npm test` from `resources/app/`.

## 2. GroupOptionCard rewrite

- [x] 2.1 Replace the per-row `Card` DOM with
  `Card(cardStyles.tableCardRounded) > CardContent(cardStyles.tableContent) > ItemGroup`,
  emitting `ItemSeparator` between rows. Keep the exported props exactly as they are.
- [x] 2.2 Map each item onto `ItemMedia` (icon), `ItemContent > ItemTitle`
  (name, subText, badge1, badge2, Default/Base badge, Inactive badge) and `ItemActions`
  (trailing icon/text marked `data-right-text="true"`, then `ActionGroup` with Switch, Delete,
  Edit, DropdownButton).
- [x] 2.3 Add the reveal CSS to `styles.row`: `position: relative`, `minHeight: 60px`,
  absolutely positioned `[data-action-group="true"]` at `opacity: 0` / `pointerEvents: none`,
  made visible by `&:hover`, `&:focus-within` and `&[data-actions-open="true"]`; the same three
  selectors set `visibility: hidden` on `[data-right-text="true"]`.
- [x] 2.4 Reduce `activeIndex` to stamping `data-actions-open` on the row whose menu is open;
  it must no longer select any style object.
- [x] 2.5 Delete `data-box-card`, `optionCardCss`, `optionCardBorderRadiusCss`,
  `optionCardBorderRadiusSingleCss`, `cardActionsCss`, `cardActionsActiveCss`,
  `groupOptionCardRightTextCss`, `groupOptionCardRightTextActiveCss`, and move the remaining
  module-scope `css(...)` constants into the bottom `defineStyles` block.
- [x] 2.6 Run `npm run typecheck && npm test` from `resources/app/`.

## 3. Remove the duplicated boxWrapper hacks

- [x] 3.1 In `schema-profile.tsx`, `tax-profile.tsx` and `variation-library.tsx`, drop the
  `<Flex data-box-wrapper cssOverride={styles.boxWrapper}>` wrapper and its `boxWrapper` style
  entry, leaving `<GroupOptionCard />` as the direct child. Remove any import left orphaned.
- [x] 3.2 Run `npm run typecheck && npm test` from `resources/app/`.

## 4. Shipping Profiles section

- [x] 4.1 Create `shipping-profile/utils.ts` with `getProfileUsage(profileName, zones)`. Keep
  the file JSX-free so it runs under vitest's `node` environment.
  **Correction:** `buildShippingProfileList` was dropped. Under vitest's `node` environment
  `sprintf` falls back to `args.join(' ')`, so a helper returning formatted badge strings could
  only be asserted against the stub's output, not against real formatting. The helper returns
  numeric counts and the component formats the badges, which keeps the tested surface honest
  and avoids a second pass over the list.
- [x] 4.2 Add `shipping-profile/utils.test.ts`: unused profile ⇒ zero counts; three rules
  across three zones ⇒ 3 rules / 3 zones; two rules in one zone ⇒ 2 rules / 1 zone; other
  condition types ignored; matching is by profile name; zones with no methods handled.
- [x] 4.3 Rewrite `shipping-profile.tsx`: `useMemo` over
  `buildShippingProfileList`, `<BoxClosedIcon />` attached at render, `<EmptyState>` for the
  empty branch, `boxWrapper` wrapper gone, `HeaderActionsCard` with the `+ Create Profile`
  button and `CreateProfilePopup` unchanged.
- [x] 4.4 Replace the `useState` optimistic delete with a query-cache one: snapshot via
  `getQueryData`, `cancelQueries`, `setQueryData` to filter the row out, undo restores the
  snapshot, and the 5s toast's `onSuccess` awaits `deleteShippingProfile(id)` then invalidates
  `['ShippingProfiles']`. Keep the raw service call, not the mutation hook.
- [x] 4.5 Run `npm run typecheck && npm test` from `resources/app/`.

## 5. Verification

- [x] 5.1 Used the dev server already running on port 5173 (the plugin hardcodes that origin,
  and vite sets `strictPort`); opened `http://localhost:20100/wp-admin/` in the in-app browser.
  No login step was needed — the session was already authenticated.
- [x] 5.2 Shipping → Profiles: the populated Figma state, hover reveal, and zero movement were
  verified live — measured `getBoundingClientRect()` for all five rows hovered vs at rest: every
  x/y/width/height delta was exactly 0, and `document.scrollHeight` was unchanged.
  **Two caveats on this environment's data:** (a) the empty state could not be reached on the
  live section without deleting all five profiles, so it was verified by rendering `EmptyState`
  temporarily on the Tryouts page (reverted afterwards) — grey panel, centred icon, 14px
  `#858B93` text, matching Figma; (b) no shipping rule in this database references a profile, so
  the usage badges render as absent (correct behaviour). Badge rendering through the new `Item`
  layout was confirmed instead on Variation Library ("17 values") and Schema Profile
  ("2 Schemas"), which use the same `badge1` path.
- [x] 5.3 Verified the remaining 7 screens: Shipping Boxes, Shipping Methods, Tax Profiles,
  Schema Profiles, Variation Library, Admin + Customer Email, Available Currencies — hover
  reveal, no reflow, no doubled border or squared corner where a `boxWrapper` was removed, and
  actions staying visible while a kebab menu is open.
- [x] 5.4 Confirm `preview-pages/group-option-card-preview.tsx` still renders.
- [x] 5.5 Functional check — **partially performed by design.** Deleted "Standard Shipping":
  the row disappeared immediately and the undo toast appeared; clicking Undo restored it, and a
  full page reload confirmed all five profiles still exist server-side, so undo genuinely
  cancels the deletion. **Not performed:** letting the 5s window elapse (that permanently
  deletes real data in the user's dev store) and create/edit (unchanged code paths —
  `CreateProfilePopup` was deliberately left untouched). The elapse path should be exercised on
  disposable data before release.
- [x] 5.6 Final `npm run typecheck && npm test` from `resources/app/`.
