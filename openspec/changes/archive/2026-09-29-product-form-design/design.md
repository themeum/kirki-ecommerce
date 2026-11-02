## Context

See [proposal.md](./proposal.md) for motivation. The product edit page lives in `EditProductInner` inside [`edit-product.tsx`](../../../resources/app/pages/products/edit-product/edit-product.tsx). Basics fields (title, ribbon, slug, description) use `react-hook-form` with `ProductBasicsFormSchema`, synced to global product context via `basicsForm.watch`. Additional Info is context-only.

**Current spacing bug:** `Card` applies `rowGap: theme.spacing[4]` via `cardStyles.formCard`, but `CardContent` is its only child — so gap never applies between fields. Other forms (e.g. brand edit dialog) wrap fields in `<Flex direction="column" gap={4}>`.

**`short_description` today:** Not on the Product model, DB, or PHP API. Exists only in import template seed data. This change is **frontend-only** for persistence; save payload includes the field for a small backend follow-up.

## Goals / Non-Goals

**Goals:**

- Add `short_description` textarea (3 rows) after Images, before Description
- Wire field through Zod schema, Product type, form context, and save payload
- Uniform 16px vertical spacing across basics card sections
- Keep separator before Additional Info with adjusted margins
- Match Figma field order without redesigning Images, Description, or Add Info button

**Non-Goals:**

- Database migration or PHP API changes
- Images and videos gallery redesign
- Description rich text editor redesign
- Changing "Add an Info Section" button colors
- Product translations / i18n table updates

## Decisions

### 1. Frontend-only persistence (for now)

**Choice:** Add `short_description` to frontend types and save payload; defer DB/API to a follow-up change.

**Rationale:** User explicitly scoped this task to frontend. Including the field in `ProductFormData` means backend wiring is additive later (migration + request/resource) without revisiting the form.

**Alternative considered:** Full-stack in one change — rejected per scope decision.

### 2. Field placement: after Images, before Description

**Choice:** Short description sits between MediaGallery and RichTextField.

**Rationale:** Matches user preference from design review. Typical flow: media → brief summary → full description.

### 3. Spacing via Flex wrapper, not Card rowGap

**Choice:** Wrap all `CardContent` children in `<Flex direction="column" gap={4}>`.

**Rationale:** Proven pattern in brand edit dialog. Fixes root cause without changing shared Card component behavior globally.

**Alternative considered:** Add gap to `CardContent` globally — rejected; would affect all cards site-wide.

### 4. Separator margins zeroed

**Choice:** Set `marginTop={0}` and `marginBottom={0}` on the Separator; let Flex gap={4} handle spacing.

**Rationale:** Avoids double-spacing (8px margin + 16px gap) that causes uneven rhythm. User chose to keep the separator line, not extra margin.

### 5. TextareaField with 3 rows

**Choice:** Use existing `TextareaField` component, `rows={3}`, optional validation via `optionalNullableString()`.

**Rationale:** Consistent with other forms; 3 rows matches compact summary intent.

### 6. Additional Info spacing

**Choice:** Wrap list + button block in `<Flex direction="column" gap={4}>` inside `additional-info.tsx`.

**Rationale:** Header already uses `gap={2}` internally; outer wrapper aligns info items and add button with card rhythm.

## Risks / Trade-offs

- **[Value lost on reload]** → Backend does not persist `short_description` yet; merchants will not see saved values after page refresh until follow-up lands. Mitigation: document in follow-up task; payload already wired.
- **[API ignores unknown field]** → PHP may strip `short_description` from requests. Mitigation: no error expected; field is inert server-side until backend change.
- **[ProductSchema nullable mismatch]** → API responses won't include `short_description`; mapper uses `?? ''`. Mitigation: safe default until backend returns the field.

## Migration Plan

1. Ship frontend changes (this change)
2. Follow-up: add `short_description` column, model `$fillable`, request validation/sanitizer, resource output
3. No rollback complexity — frontend field is additive; removing it later is safe if unused

## Open Questions

(none — placement, scope, spacing, and separator decisions resolved in design review)
