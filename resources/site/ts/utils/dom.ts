/**
 * DOM utility helpers for site interactions.
 */

/**
 * Scroll smoothly to the first visible field or alert with an active error state.
 */
export function scrollToFirstError(delay = 50): void {
  setTimeout(() => {
    const errorElements = Array.from(
      document.querySelectorAll<HTMLElement>('.kecom-field-error-state, .kecom-alert-error'),
    );
    const firstVisibleError = errorElements.find(
      (el) => el.offsetParent !== null || getComputedStyle(el).display !== 'none',
    );
    if (firstVisibleError) {
      firstVisibleError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, delay);
}
