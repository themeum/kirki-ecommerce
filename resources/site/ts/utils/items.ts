import { apiRequest } from '../api/client';
import { toastManager } from '../services/toast/runtime';

interface ItemsResponse {
  data: {
    items: string;
    pagination: string;
  };
  message: string;
  success: boolean;
}

export async function fetchItems(
  apiUrl: string,
  itemsGridClass: string,
  paginationContainerClass: string,
  headerClass: string,
  shouldScroll = false,
  isLoading: boolean,
) {
  isLoading = true;
  const { __ } = window.wp.i18n;

  try {
    const params = new URLSearchParams(window.location.search);
    const result = await apiRequest<ItemsResponse>(`${apiUrl}?format=html&${params.toString()}`);

    if (result && result.success !== false && result.data) {
      // Update items grid
      const itemsGrid = document.querySelector(`.${itemsGridClass}`);
      if (itemsGrid && result.data.items !== undefined) {
        itemsGrid.innerHTML = result.data.items;
      }

      // Update pagination container
      const paginationContainer = document.querySelector(`.${paginationContainerClass}`);

      if (paginationContainer && result.data.pagination !== undefined) {
        paginationContainer.innerHTML = result.data.pagination;
      }

      // Smoothly scroll to the page title if requested
      if (shouldScroll) {
        const pageTitle = document.querySelector(`.${headerClass}`);
        if (pageTitle) {
          pageTitle.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      throw new Error(result?.message || 'Failed to fetch items');
    }
  } catch (error) {
    console.error('Error fetching items:', error);
    toastManager.error(__('Failed to retrieve items. Please try again.', 'kirki-ecommerce'));
  } finally {
    isLoading = false;
  }
}
