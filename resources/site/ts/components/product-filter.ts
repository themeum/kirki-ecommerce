/**
 * Alpine component: productFilter
 * Handles sidebar filtering for product list page.
 *
 * PHP usage:
 *   <div x-data="productFilter({ 
 *     categories: <?= json_encode($categories) ?>,
 *     priceRange: { min: 0, max: 1000 },
 *     initialFilters: <?= json_encode($active_filters) ?>
 *   })">
 */

export interface FilterOption {
  id: string | number;
  name: string;
  count?: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface ProductFilterConfig {
  categories?: FilterOption[];
  priceRange?: PriceRange;
  initialFilters?: {
    category?: string | number;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    inStock?: boolean;
  };
}

export function productFilter(config: ProductFilterConfig = {}) {
  return {
    categories: config.categories ?? [],
    priceRange: config.priceRange ?? { min: 0, max: 1000 },
    
    // Active filters
    selectedCategory: config.initialFilters?.category ?? null,
    minPrice: config.initialFilters?.minPrice ?? config.priceRange?.min ?? 0,
    maxPrice: config.initialFilters?.maxPrice ?? config.priceRange?.max ?? 1000,
    searchQuery: config.initialFilters?.search ?? '',
    inStockOnly: config.initialFilters?.inStock ?? false,
    
    expanded: {
      categories: true,
      price: true,
    },

    get hasActiveFilters(): boolean {
      return !!this.selectedCategory || 
             this.minPrice > this.priceRange.min ||
             this.maxPrice < this.priceRange.max ||
             this.searchQuery !== '' ||
             this.inStockOnly;
    },

    setCategory(categoryId: string | number | null) {
      this.selectedCategory = categoryId;
      this.applyFilters();
    },

    updatePrice() {
      // Ensure min doesn't exceed max
      if (this.minPrice > this.maxPrice) {
        this.minPrice = this.maxPrice;
      }
      this.applyFilters();
    },

    toggleStock() {
      this.inStockOnly = !this.inStockOnly;
      this.applyFilters();
    },

    clearSearch() {
      this.searchQuery = '';
      this.applyFilters();
    },

    resetAll() {
      this.selectedCategory = null;
      this.minPrice = this.priceRange.min;
      this.maxPrice = this.priceRange.max;
      this.searchQuery = '';
      this.inStockOnly = false;
      this.applyFilters();
    },

    applyFilters() {
      // Dispatch event for the page to handle URL updates
      (this as any).$dispatch('filter-change', {
        category: this.selectedCategory,
        minPrice: this.minPrice,
        maxPrice: this.maxPrice,
        search: this.searchQuery,
        inStock: this.inStockOnly,
      });
    },

    toggleSection(section: 'categories' | 'price') {
      this.expanded[section] = !this.expanded[section];
    },
  };
}
