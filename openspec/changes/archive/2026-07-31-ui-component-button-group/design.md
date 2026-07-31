## Context

See proposal.md — Why. UI components under `resources/app/components/ui/` use Emotion with `defineStyles`, `scopedMerge`, and theme tokens — not Tailwind/CVA. [`input-group.tsx`](resources/app/components/ui/input-group.tsx) is the reference shadcn v4 port: compound named exports, `data-slot` attributes, `role="group"`, `cssOverride` prop, `forwardRef`.

Upstream shadcn v4 [`button-group`](https://ui.shadcn.com/docs/components/radix/button-group) defines three primitives with orientation-based border/radius merging, nested group gaps, and child selectors for buttons, inputs, and select triggers.

[`action-group.tsx`](resources/app/components/ui/action-group.tsx) already handles spaced toolbar actions (`marginLeft: auto`, flex gap) — a different use case. ButtonGroup targets visually connected controls.

## Goals / Non-Goals

**Goals:**

- Port shadcn v4 ButtonGroup API to Emotion: `ButtonGroup`, `ButtonGroupSeparator`, `ButtonGroupText`
- Named exports from `button-group.tsx`, matching `input-group.tsx` compound pattern
- Full child support: Button, Input, SelectTrigger, nested ButtonGroups
- Add `data-slot="button"` and `data-slot="select-trigger"` for reliable CSS targeting
- Component-only delivery — no consumer migrations in this change

**Non-Goals:**

- Replacing ActionGroup or migrating existing ActionGroup call sites
- Preview page or Storybook entry
- Tailwind/CVA/cn utility introduction
- ToggleGroup behavior (stateful selection) — ButtonGroup is for actions, not toggling
- Modifying Button variants or adding a dedicated `ButtonGroupButton` wrapper

## Decisions

### 1. Emotion port, not literal shadcn install

**Choice:** Implement styles as `defineStyles` + `scopedMerge` in a new `button-group.tsx`, translating shadcn Tailwind selectors to Emotion child selectors.

**Rationale:** Entire UI layer uses Emotion/theme tokens. Introducing Tailwind for one component breaks consistency.

**Alternative considered:** `pnpm dlx shadcn add button-group` — rejected; requires Tailwind v4 infrastructure not present in this app.

### 2. Named exports, compound API

**Choice:** Export `{ ButtonGroup, ButtonGroupSeparator, ButtonGroupText }` from one file.

**Rationale:** Matches shadcn import ergonomics and existing `input-group.tsx` pattern. Default export reserved for single-purpose components like `Button`.

### 3. Child targeting via data-slot + element selectors

**Choice:** Add `data-slot="button"` on Button (both render paths) and `data-slot="select-trigger"` on SelectTrigger. ButtonGroup CSS targets:

- `> button`, `> input`, `> [data-slot="button-group-text"]`, `> [data-slot="select-trigger"]`
- Nested: `> [data-slot="button-group"]`

**Rationale:** Select wraps its trigger — direct-child `> button` alone misses Select-in-group cases. data-slot gives stable hooks without restructuring Select.

**Alternative considered:** Element selectors only (`> button`, `> input`) — rejected for Select composition gap.

### 4. Border/radius merge via CSS child selectors

**Choice:** Orientation-specific rules on ButtonGroup root:

- **Horizontal:** non-first children → `borderTopLeftRadius: 0`, `borderBottomLeftRadius: 0`, `borderLeftWidth: 0`; non-last → right radius zeroed
- **Vertical:** analogous top/bottom rules + `flexDirection: 'column'`

Map shadcn radius tokens to `theme.radius.md` / `theme.radius.lg` to align with Button defaults.

**Rationale:** Same technique as shadcn's `[&>*:not(:first-child)]:rounded-l-none` — no Button API changes needed.

### 5. ButtonGroupSeparator wraps existing Separator

**Choice:** Reuse [`Separator`](resources/app/components/ui/separator.tsx) with `data-slot="button-group-separator"`, `margin: 0`, `alignSelf: 'stretch'`.

**Rationale:** Avoid duplicating separator logic; Radix Separator already handles orientation.

### 6. ButtonGroupText styling

**Choice:** Muted fill (`theme.colors.background.surfaceAlt`), default border, `theme.typography.small('medium')`, horizontal padding `theme.spacing[3]`, `asChild` via `@radix-ui/react-slot`.

**Rationale:** Mirrors shadcn's `bg-muted` text slot and matches InputGroupText tone in the codebase.

### 7. Focus z-index stacking

**Choice:** `'& > *:focus-visible': { position: 'relative', zIndex: 1 }` on ButtonGroup root.

**Rationale:** Prevents focus rings on middle buttons from being clipped by adjacent siblings — matches shadcn behavior.

## Risks / Trade-offs

- **[Filled button variants merge visually]** → Primary/secondary buttons use transparent borders; merge is mainly radius, not border removal. Mitigated: document that outline variant shows clearest merge; filled variants still lose double-radius gaps.
- **[Select not direct child]** → SelectTrigger is nested inside Select Root. Mitigated: descendant selector `[data-slot="select-trigger"]` or require SelectTrigger as direct child in docs; data-slot on trigger enables styling when structure allows.
- **[cssOverride on group vs children]** → Group override does not cascade to children. Mitigated: matches project `cssOverride` contract (root only); children use their own overrides.

## Migration Plan

1. Add `data-slot` attributes to Button and SelectTrigger (additive, non-breaking)
2. Create `button-group.tsx` with three exports and style map
3. Lint/type-check the three touched files
4. Rollback: revert branch — no runtime flags or data migrations

## Open Questions

(none — implementation approach, API surface, export pattern, and scope were resolved in planning)
