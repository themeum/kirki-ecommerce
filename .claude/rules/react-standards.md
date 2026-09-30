---
paths:
  - "resources/app/**/*.ts"
  - "resources/app/**/*.tsx"
---

# React / TypeScript Coding Standards

Derived from analyzing the actual code in `resources/app/`.
Applies to: `resources/app/**/*.{ts,tsx}`.

**Note:** the old `.cursor/rules/react-standards.mdc` targets `**/*.jsx`, but
this codebase has fully migrated to TypeScript — there are zero `.jsx` files
left (351 `.tsx`, 192 `.ts`). Write all new frontend code in `.ts`/`.tsx`.

### Files and Folders

- Folders and files: **lowercase**, words separated by **dashes**
  (`brand-table/`, `confirmation-dialog.tsx`, `use-debounce.ts`)
- Don't create a barrel `index.ts` per component. The only barrels in this
  codebase aggregate a whole domain (`types/index.ts`, `hooks/index.ts`,
  `theme/index.ts`, `components/data-table/index.ts`) — reserve that pattern
  for a similarly cohesive module, not a single component.
- Hook filenames should be `use-thing.ts` (kebab-case), matching `use-debounce.ts`
  and `use-list-params.ts`. `useBulkEditList.ts` / `useMarkList.ts` are legacy
  camelCase leftovers — don't add new files in that style.
- Co-locate tests next to the file they cover: `brand-form.ts` + `brand-form.test.ts`
  (Vitest — run via `npm test` in `resources/app/`).

### Components

- Component names: **PascalCase** (`ConfirmationDialog`, `DataTable`)
- Define as arrow functions, `displayName` set explicitly, default export at the bottom:

```tsx
const ConfirmationDialog = (props: ConfirmationDialogProps) => {
  // ...
  return <Dialog>...</Dialog>;
};

ConfirmationDialog.displayName = "ConfirmationDialog";

export default ConfirmationDialog;
```

- Props typed with a `type Xxx = { ... }` declared above the component
  (not `interface`), named `<ComponentName>Props`.
- `forwardRef` / `memo`: assign `displayName` on the wrapped const, same as above.

### Control Flow

Never use inline returns for conditional statements — always wrap the body in braces (followed with zero exceptions in this codebase):

```tsx
// ❌ BAD
if (condition) return true;

// ✅ GOOD
if (condition) {
  return true;
}
```

### Strings and i18n

- JavaScript/TypeScript strings: single quotes `'value'` or backticks for template literals — never double quotes
- JSX prop string values: double quotes (`variant="primary"`, `size="large"`)
- User-facing static text: use `__()` from `@/wpi18n` with domain `kirki-ecommerce`

```tsx
import { __ } from "@/wpi18n";

<Button text={__("Save changes", "kirki-ecommerce")} variant="primary" />;
```

### Imports

Group imports in this order, separated by blank lines:

1. External packages (`react`, `react-router`, `lucide-react`, etc.)
2. Internal `@/` aliases (`@/components/ui/button`, `@/theme`, `@/wpi18n`, etc.)
3. Relative imports (`./confirmation-dialog.scss`)

Always use the `@/` alias for internal paths — avoid deep relative imports when an alias exists.
Use `import type { ... }` for type-only imports.

```tsx
import { Info } from "lucide-react";
import type { ReactNode } from "react";

import Button from "@/components/ui/button";
import { theme } from "@/theme";
import { __ } from "@/wpi18n";

import "./confirmation-dialog.scss";
```

### Styling

Styling goes through `@emotion/react`, not plain CSS modules or inline
`style` for anything non-dynamic:

- Define styles with `defineStyles({...})` from `@/theme/mixins`, keyed by element role
- Reference design tokens from `theme` (`@/theme`) — colors, spacing,
  radius, typography — instead of hardcoded values
- Make sure the applied design does not cause any layout shifting to the interface.
- Apply with the `css` prop (`scoped(styles.icon)` for scoped styles), and
  reserve the `style` prop for truly dynamic, runtime-computed values

```tsx
const styles = defineStyles({
  title: {
    ...theme.typography.heading4(),
    textAlign: "center",
  },
});
```

### Forms and Validation

Form schemas live in `schemas/forms/<name>-form.ts` and follow one consistent
shape (see `features/brands/schemas/forms/brand-form.ts`):

```ts
const XxxFormShape = z.object({
  /* fields, using helpers from @/libs/zod */
});

const XxxFormSchema = prepareFormSchema(XxxFormShape).transform((values) => ({
  /* map to the payload shape the API expects */
}));

type XxxFormInput = z.input<typeof XxxFormSchema>;
type XxxFormPayload = z.output<typeof XxxFormSchema>;

export { XxxFormSchema, type XxxFormInput, type XxxFormPayload };
```

Use `react-hook-form` with `@hookform/resolvers` to wire the schema to the form.

### Data Fetching

- API calls go in `services/<resource>.ts`, built on `axios`
- Components consume them through `@tanstack/react-query` (`useQuery`/`useMutation`), not ad-hoc `useEffect` + `useState` fetching

### Comments

Do not add comments to describe code. Use meaningful variable and function names so the code reads clearly on its own.
