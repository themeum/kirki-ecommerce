/**
 * Alpine component: tabs
 * Simple tab component for product details page.
 *
 * PHP usage:
 *   <div x-data="tabs({ 
 *     activeTab: 'description'
 *   })">
 */

export interface TabsConfig {
  activeTab?: string;
  tabs?: { id: string; label: string }[];
}

export function tabs(config: TabsConfig = {}) {
  return {
    activeTab: config.activeTab ?? (config.tabs?.[0]?.id ?? 'tab-1'),
    tabs: config.tabs ?? [],

    setActive(tabId: string) {
      this.activeTab = tabId;
      (this as any).$dispatch('tab-change', { tabId });
    },

    isActive(tabId: string): boolean {
      return this.activeTab === tabId;
    },
  };
}
