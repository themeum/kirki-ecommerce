import type { ActionKey, HomePeriod, SectionKey } from '@/features/home/lib/layout';
import { __ } from '@/wpi18n';

const getPeriodLabel = (period: HomePeriod) => {
  const labels: Record<HomePeriod, string> = {
    month: __('This month', 'kirki-ecommerce'),
    week: __('This week', 'kirki-ecommerce'),
    today: __('Today', 'kirki-ecommerce'),
    all: __('All time', 'kirki-ecommerce'),
  };

  return labels[period];
};

const getActionLabel = (action: ActionKey) => {
  const labels: Record<ActionKey, string> = {
    create_order: __('Create order', 'kirki-ecommerce'),
    view_live_site: __('View live site', 'kirki-ecommerce'),
    add_product: __('Add product', 'kirki-ecommerce'),
    create_coupon: __('Create coupon', 'kirki-ecommerce'),
    add_customer: __('Add customer', 'kirki-ecommerce'),
  };

  return labels[action];
};

const getSectionTitle = (section: SectionKey) => {
  const titles: Record<SectionKey, string> = {
    key_numbers: __('Key numbers', 'kirki-ecommerce'),
    recent_orders: __('Recent orders', 'kirki-ecommerce'),
    top_products: __('Top selling products', 'kirki-ecommerce'),
    restock_soon: __('Restock soon', 'kirki-ecommerce'),
    needs_attention: __('Needs your attention', 'kirki-ecommerce'),
  };

  return titles[section];
};

export { getActionLabel, getPeriodLabel, getSectionTitle };
