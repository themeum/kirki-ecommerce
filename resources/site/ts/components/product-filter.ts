/**
 * Alpine component: productFilter
 * Handles shop page product sorting.
 */

const SORT_BY_PARAM = 'sort_by';
const PAGE_PARAM = 'current_page';
const DEFAULT_SORT = 'recommended';
const ALLOWED_SORTS = [DEFAULT_SORT, 'low_to_high', 'high_to_low'] as const;

type SortBy = (typeof ALLOWED_SORTS)[number];

export type ProductFilterConfig = {
  initialSortBy?: string | null;
};

function normalizeSort(value?: string | null): SortBy {
  return ALLOWED_SORTS.includes(value as SortBy) ? (value as SortBy) : DEFAULT_SORT;
}

export function productFilter(config: ProductFilterConfig = {}) {
  return {
    sortBy: normalizeSort(config.initialSortBy),

    applySort(value: string) {
      this.sortBy = normalizeSort(value);

      const params = new URLSearchParams(window.location.search);

      if (this.sortBy === DEFAULT_SORT) {
        params.delete(SORT_BY_PARAM);
      } else {
        params.set(SORT_BY_PARAM, this.sortBy);
      }

      params.delete(PAGE_PARAM);

      const queryString = params.toString();
      window.location.href = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
    },
  };
}

const SIDEBAR_FILTER_PARAMS = ['category_ids[]', 'brand_ids[]', 'attribute_value_ids[]'];

export function shopSidebar() {
  return {
    applyFilters(event: Event) {
      const target = event.target as HTMLInputElement;

      if (target.type !== 'checkbox') {
        return;
      }

      const sidebar = event.currentTarget as HTMLElement;
      const params = new URLSearchParams(window.location.search);

      SIDEBAR_FILTER_PARAMS.forEach((name) => {
        params.delete(name);
      });
      params.delete(PAGE_PARAM);

      SIDEBAR_FILTER_PARAMS.forEach((name) => {
        sidebar.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`).forEach((checkbox) => {
          params.append(name, checkbox.value);
        });
      });

      const queryString = params.toString();
      window.location.href = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
    },
  };
}
