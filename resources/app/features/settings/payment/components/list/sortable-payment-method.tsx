import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { CardSimIcon, LandmarkIcon } from 'lucide-react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Image from '@/components/ui/image';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItemTitle,
} from '@/components/ui/stacked-items';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import type { PaymentMethod } from '@/features/settings/payment/schemas/catalog/payment';
import { EditPenIcon, TrashIcon } from '@/icons/common';
import { theme } from '@/theme';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type SortablePaymentMethodProps = {
  method: PaymentMethod;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (method: PaymentMethod) => void;
  onToggle: (method: PaymentMethod) => void;
};

const UNDELETABLE_METHOD_IDS: PaymentMethod['id'][] = ['paypal'];

const getIconUrl = (icon: PaymentMethod['icon']) => {
  if (typeof icon !== 'string') {
    return null;
  }

  return /^(https?:)?\/\//.test(icon) || icon.startsWith('/') ? icon : null;
};

const renderMethodIcon = (method: PaymentMethod) => {
  const iconUrl = getIconUrl(method.icon);

  if (iconUrl) {
    return (
      <Image
        src={iconUrl}
        alt={__('Logo', 'kirki-ecommerce')}
        height={20}
        width={20}
        fit="contain"
        cssOverride={styles.image}
      />
    );
  }

  return method.is_offline ? (
    <LandmarkIcon size={20} color={theme.colors.icon.secondary} />
  ) : (
    <CardSimIcon size={20} color={theme.colors.icon.secondary} />
  );
};

const SortablePaymentMethod = (props: SortablePaymentMethodProps) => {
  const { method, onEdit, onDelete, onToggle } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: method.id });

  const name = method.name ?? '';
  const isDeletable = !UNDELETABLE_METHOD_IDS.includes(method.id);

  return (
    <StackedItem
      ref={setNodeRef}
      id={String(method.id)}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      cssOverride={mergeCss(styles.row, isDragging && styles.placeholder)}
    >
      <StackedItemMedia cssOverride={styles.media}>
        <span data-slot="payment-method-icon" css={scoped(styles.layer)}>
          {renderMethodIcon(method)}
        </span>
        <span
          ref={setActivatorNodeRef}
          data-slot="payment-method-handle"
          css={scoped(mergeCss(styles.layer, styles.handle))}
          {...attributes}
          {...listeners}
          aria-label={sprintf(
            /* translators: %s: payment method name */
            __('Reorder %s', 'kirki-ecommerce'),
            name,
          )}
        >
          <DragHandleDots2Icon />
        </span>
      </StackedItemMedia>

      <StackedItemContent>
        <StackedItemTitle>
          <Text weight="medium" color="primary">
            {name}
          </Text>
        </StackedItemTitle>
      </StackedItemContent>

      <StackedItemActions>
        <ActionGroup gap={1}>
          {isDeletable && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={sprintf(
                /* translators: %s: payment method name */
                __('Delete %s', 'kirki-ecommerce'),
                name,
              )}
              onClick={() => onDelete(method)}
            >
              <TrashIcon />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={sprintf(
              /* translators: %s: payment method name */
              __('Edit %s', 'kirki-ecommerce'),
              name,
            )}
            onClick={() => onEdit(method)}
          >
            <EditPenIcon color="#000" />
          </Button>
          <Switch
            checked={Boolean(method.is_enabled)}
            aria-label={sprintf(
              /* translators: %s: payment method name */
              __('Enable %s', 'kirki-ecommerce'),
              name,
            )}
            onCheckedChange={() => onToggle(method)}
          />
        </ActionGroup>
      </StackedItemActions>
    </StackedItem>
  );
};

SortablePaymentMethod.displayName = 'SortablePaymentMethod';

export default SortablePaymentMethod;

const styles = defineStyles({
  row: {
    '& [data-slot="payment-method-handle"]': {
      opacity: 0,
    },
    '&:hover, &:focus-within, &[data-actions-open="true"]': {
      backgroundColor: theme.colors.background.surfaceAlt,
      '& [data-slot="payment-method-icon"]': {
        opacity: 0,
      },
      '& [data-slot="payment-method-handle"]': {
        opacity: 1,
      },
    },
    '@media (hover: none)': {
      '& [data-slot="payment-method-icon"]': {
        opacity: 0,
      },
      '& [data-slot="payment-method-handle"]': {
        opacity: 1,
      },
      '& [data-action-group="true"]': {
        opacity: 1,
        pointerEvents: 'auto',
      },
    },
  },
  placeholder: {
    opacity: 0.4,
  },
  media: {
    position: 'relative',
    width: '16px',
    height: '16px',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    color: theme.colors.icon.secondary,
    cursor: 'grab',
    borderRadius: theme.radius.sm,
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.background.fillBrand}`,
      outlineOffset: '2px',
    },
  },
  image: {
    width: 'auto',
    border: 'none',
    borderRadius: theme.radius.none,
    backgroundColor: 'transparent',
  },
});
