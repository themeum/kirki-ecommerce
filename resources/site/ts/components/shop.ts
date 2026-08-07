import { apiRequest } from "../api/client";
import { toastManager } from "../services/toast/runtime";

interface ShopProductsResponse {
    success?: boolean;
    message?: string;
    data: {
        products_html?: string;
        pagination_html?: string;
        filters?: any;
    };
}

export function shop() {
    const { __ } = window.wp.i18n;

    return {
        sortBy: 'recommended',
        isLoading: false,

        init() {
            // Read initial sort_by from URL params
            const params = new URLSearchParams(window.location.search);
            this.sortBy = params.get('sort_by') || 'recommended';

            // Handle browser back/forward buttons
            window.addEventListener('popstate', () => {
                const currentParams = new URLSearchParams(window.location.search);
                this.sortBy = currentParams.get('sort_by') || 'recommended';
                this.fetchProducts();
            });

            // Intercept pagination clicks dynamically
            const paginationContainer = document.querySelector('.kecom-pagination-container');
            if (paginationContainer) {
                paginationContainer.addEventListener('click', (e: Event) => {
                    const target = e.target as HTMLElement;
                    const link = target.closest('a.kecom-page-link') as HTMLAnchorElement;
                    if (link) {
                        e.preventDefault();
                        const urlObj = new URL(link.href);

                        // Update the browser URL with the current page path and the query parameters from the pagination link
                        window.history.pushState({}, '', window.location.pathname + urlObj.search);
                        this.fetchProducts(true);
                    }
                });
            }
        },

        async applySort(value: string) {
            this.sortBy = value;
            
            const params = new URLSearchParams(window.location.search);
            if (value === 'recommended') {
                params.delete('sort_by');
            } else {
                params.set('sort_by', value);
            }

            // "if any time other filter added than current_page value will be reset to 1."
            params.delete('current_page');

            const queryString = params.toString();
            const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
            window.history.pushState({}, '', newUrl);

            this.fetchProducts();
        },

        async fetchProducts(shouldScroll = false) {
            this.isLoading = true;
            try {
                const params = new URLSearchParams(window.location.search);
                const result = await apiRequest<ShopProductsResponse>(`/shop/products-html?${params.toString()}`);

                if (result && result.success !== false && result.data) {
                    // Update products grid
                    const productsGrid = document.querySelector('.kecom-products-grid');
                    if (productsGrid && result.data.products_html !== undefined) {
                        productsGrid.innerHTML = result.data.products_html;
                    }

                    // Update pagination container
                    const paginationContainer = document.querySelector('.kecom-pagination-container');
                    if (paginationContainer && result.data.pagination_html !== undefined) {
                        paginationContainer.innerHTML = result.data.pagination_html;
                    }
                    
                    // Smoothly scroll to the page title if requested
                    if (shouldScroll) {
                        const pageTitle = document.querySelector('.kecom-breadcrumb-list');
                        if (pageTitle) {
                            pageTitle.scrollIntoView({ behavior: 'smooth' });
                        }
                    }

                    // Dispatch event for any other components that need to know products updated
                    window.dispatchEvent(new CustomEvent('shop:products-updated', { detail: result.data }));
                } else {
                    throw new Error(result?.message || 'Failed to fetch products');
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                toastManager.error(__('Failed to retrieve products. Please try again.', 'kirki-ecommerce'));
            } finally {
                this.isLoading = false;
            }
        }
    }
}