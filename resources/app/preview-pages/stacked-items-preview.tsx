import type { ReactNode } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
} from '@/components/ui/stacked-items';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import { EditPenIcon, TrashIcon, TruckIcon } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type StackedItemsPreviewItem = {
  id: string;
  name: string;
  subText: string;
  icon: ReactNode;
  rightText: string;
  is_enabled?: boolean;
};

const data: StackedItemsPreviewItem[] = [
  {
    id: '1',
    name: 'Standard Delivery',
    subText: '2-3days',
    icon: <TruckIcon />,
    rightText: '$10',
  },
  {
    id: '2',
    name: 'Rate by Weight',
    subText: '2-3days',
    icon: <TruckIcon />,
    rightText: '$10',
  },
  {
    id: '3',
    name: 'Free Shipping',
    subText: '2-3days',
    icon: <TruckIcon />,
    rightText: '$10',
  },
];

const StackedItemsPreview = () => {
  return (
    <div>
      <StackedItems>
        {data.map((item) => (
          <StackedItem key={item.id} id={item.id}>
            <StackedItemMedia>{item.icon}</StackedItemMedia>
            <StackedItemContent>
              <StackedItemTitle>
                <Text variant="small" weight="medium">
                  {item.name}
                </Text>
                <Text variant="tiny" color="subdued">
                  {item.subText}
                </Text>
              </StackedItemTitle>
            </StackedItemContent>
            <StackedItemActions>
              <ActionGroup>
                <Switch
                  checked={Boolean(item.is_enabled)}
                  onCheckedChange={() => {
                    console.log(item);
                  }}
                />
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={__('Delete', 'kirki-ecommerce')}
                  cssOverride={styles.actionButton}
                  onClick={() => {
                    console.log(item);
                  }}
                >
                  <TrashIcon />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={__('Edit', 'kirki-ecommerce')}
                  cssOverride={styles.actionButton}
                  onClick={() => {
                    console.log(item);
                  }}
                >
                  <EditPenIcon />
                </Button>
              </ActionGroup>
            </StackedItemActions>
          </StackedItem>
        ))}
      </StackedItems>
    </div>
  );
};

StackedItemsPreview.displayName = 'StackedItemsPreview';

export default StackedItemsPreview;

const styles = defineStyles({
  actionButton: {
    padding: theme.spacing[1],
  },
});
