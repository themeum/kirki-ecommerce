import { Eye, Plus } from 'lucide-react';
import { Link } from 'react-router';

import Button from '@/components/ui/button';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import { getActionLabel } from '@/features/home/lib/labels';
import type { ActionKey, HomeLayoutItem } from '@/features/home/lib/layout';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

const getActionLink = (action: Exclude<ActionKey, 'view_live_site'>) => {
  const links: Record<Exclude<ActionKey, 'view_live_site'>, string> = {
    create_order: RouteConfig.Orders.get('CreateOrder').buildLink(),
    add_product: RouteConfig.Products.get('CreateProduct').buildLink(),
    create_coupon: RouteConfig.Coupons.get('EditCoupon').buildLink({ id: NEW_ITEM_ID }),
    add_customer: RouteConfig.Customers.get('CustomerDetail').buildLink({ id: NEW_ITEM_ID }),
  };

  return links[action];
};

type QuickActionButtonProps = {
  action: ActionKey;
  isPrimary: boolean;
};

const QuickActionButton = (props: QuickActionButtonProps) => {
  const { action, isPrimary } = props;
  const label = getActionLabel(action);

  if (action === 'view_live_site') {
    return (
      <Button
        variant={isPrimary ? 'primary' : 'ghost'}
        asChild
        cssOverride={isPrimary ? undefined : styles.secondary}
      >
        <a href={window.kirki_ecommerce.site_url} target="_blank" rel="noopener noreferrer">
          <Eye size={16} aria-hidden="true" />
          {label}
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant={isPrimary ? 'primary' : 'ghost'}
      asChild
      cssOverride={isPrimary ? undefined : styles.secondary}
    >
      <Link to={getActionLink(action)}>
        <Plus size={16} aria-hidden="true" />
        {label}
      </Link>
    </Button>
  );
};

QuickActionButton.displayName = 'QuickActionButton';

type QuickActionsProps = {
  actions: HomeLayoutItem<ActionKey>[];
};

const QuickActions = (props: QuickActionsProps) => {
  const { actions } = props;
  const visible = actions.filter((item) => item.visible).map((item) => item.key);

  if (visible.length === 0) {
    return null;
  }

  return (
    <>
      {visible
        .map((action, index) => (
          <QuickActionButton key={action} action={action} isPrimary={index === 0} />
        ))
        .reverse()}
    </>
  );
};

QuickActions.displayName = 'QuickActions';

export default QuickActions;

const styles = defineStyles({
  secondary: {
    backgroundColor: theme.colors.background.surface,
  },
});
