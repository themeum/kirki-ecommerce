/**
 * Minimum shape a node must satisfy to render in the tree. Any richer
 * category object (the categories API's `Category`, a form's stored ref)
 * structurally satisfies it, so callers keep their own type end to end.
 */
type CategoryTreeItem = {
  id: number;
  name: string;
  parent_id?: number | null;
  level?: number;
};

export type { CategoryTreeItem };
