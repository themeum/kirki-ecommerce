import { keyframes } from '@emotion/react';
import { X } from 'lucide-react';
import { Fragment, type ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import { useFirstSaleCelebration } from '@/features/home/hooks/use-first-sale-celebration';
import {
  useFirstSaleDismissMutation,
  useFirstSaleFulfillMutation,
  useFirstSaleQuery,
} from '@/features/home/services/first-sale';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const SQUIRCLE_OUTER =
  'M36 18L35.95 21.54L35.82 23.6L35.59 25.31L35.27 26.8L34.86 28.14L34.35 29.34L33.76 30.43L33.07 31.41L32.29 32.29L31.41 33.07L30.43 33.76L29.34 34.35L28.14 34.86L26.8 35.27L25.31 35.59L23.6 35.82L21.54 35.95L18 36L14.46 35.95L12.4 35.82L10.69 35.59L9.2 35.27L7.86 34.86L6.66 34.35L5.57 33.76L4.59 33.07L3.71 32.29L2.93 31.41L2.24 30.43L1.65 29.34L1.14 28.14L0.73 26.8L0.41 25.31L0.18 23.6L0.05 21.54L0 18L0.05 14.46L0.18 12.4L0.41 10.69L0.73 9.2L1.14 7.86L1.65 6.66L2.24 5.57L2.93 4.59L3.71 3.71L4.59 2.93L5.57 2.24L6.66 1.65L7.86 1.14L9.2 0.73L10.69 0.41L12.4 0.18L14.46 0.05L18 0L21.54 0.05L23.6 0.18L25.31 0.41L26.8 0.73L28.14 1.14L29.34 1.65L30.43 2.24L31.41 2.93L32.29 3.71L33.07 4.59L33.76 5.57L34.35 6.66L34.86 7.86L35.27 9.2L35.59 10.69L35.82 12.4L35.95 14.46Z';
const SQUIRCLE_INNER =
  'M34.5 18L34.46 21.24L34.33 23.14L34.12 24.7L33.83 26.07L33.45 27.29L32.99 28.39L32.45 29.39L31.81 30.29L31.1 31.1L30.29 31.81L29.39 32.45L28.39 32.99L27.29 33.45L26.07 33.83L24.7 34.12L23.14 34.33L21.24 34.46L18 34.5L14.76 34.46L12.86 34.33L11.3 34.12L9.93 33.83L8.71 33.45L7.61 32.99L6.61 32.45L5.71 31.81L4.9 31.1L4.19 30.29L3.55 29.39L3.01 28.39L2.55 27.29L2.17 26.07L1.88 24.7L1.67 23.14L1.54 21.24L1.5 18L1.54 14.76L1.67 12.86L1.88 11.3L2.17 9.93L2.55 8.71L3.01 7.61L3.55 6.61L4.19 5.71L4.9 4.9L5.71 4.19L6.61 3.55L7.61 3.01L8.71 2.55L9.93 2.17L11.3 1.88L12.86 1.67L14.76 1.54L18 1.5L21.24 1.54L23.14 1.67L24.7 1.88L26.07 2.17L27.29 2.55L28.39 3.01L29.39 3.55L30.29 4.19L31.1 4.9L31.81 5.71L32.45 6.61L32.99 7.61L33.45 8.71L33.83 9.93L34.12 11.3L34.33 12.86L34.46 14.76Z';
const SQUIRCLE_OUTER_FILL = '#d6e6ff';
const SQUIRCLE_INNER_FILL = '#e8f2ff';

const fillPlaceholders = (template: string, parts: ReactNode[]) => {
  return template.split(/(%\d\$s)/).map((segment, index) => {
    const placeholder = /^%(\d)\$s$/.exec(segment);

    return (
      <Fragment key={index}>{placeholder ? parts[Number(placeholder[1]) - 1] : segment}</Fragment>
    );
  });
};

const FirstSaleIcon = () => {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" css={scoped(styles.icon)}>
      <path d={SQUIRCLE_OUTER} fill={SQUIRCLE_OUTER_FILL} />
      <path d={SQUIRCLE_INNER} fill={SQUIRCLE_INNER_FILL} />
      <path
        d="M14.6 13.6h6.8a1.6 1.6 0 0 1 1.58 1.36l1.2 8a1.6 1.6 0 0 1-1.58 1.84h-9.2a1.6 1.6 0 0 1-1.58-1.84l1.2-8a1.6 1.6 0 0 1 1.58-1.36z"
        css={scoped(styles.bag)}
      />
      <path
        d="M15.6 16.6a2.4 2.4 0 0 0 4.8 0"
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle
        cx="22.9"
        cy="14"
        r="2.2"
        stroke={SQUIRCLE_INNER_FILL}
        strokeWidth="1.2"
        data-first-sale-dot=""
        css={scoped(styles.dot)}
      />
    </svg>
  );
};

FirstSaleIcon.displayName = 'FirstSaleIcon';

const FirstSaleCard = () => {
  const { data } = useFirstSaleQuery();
  const { mutate: dismiss } = useFirstSaleDismissMutation();
  const { mutate: fulfill } = useFirstSaleFulfillMutation();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  useFirstSaleCelebration(Boolean(data?.should_celebrate), cardRef);

  if (!data?.is_visible || !data.order) {
    return null;
  }

  const { order } = data;
  const orderLink = RouteConfig.Orders.get('OrderDetail').buildLink({ id: order.id });

  const handleFulfill = () => {
    fulfill();
    void navigate(orderLink);
  };

  const description = fillPlaceholders(
    /* translators: 1: customer name, 2: order total, 3: order number */
    __(
      '%1$s ordered %2$s (%3$s). Every store starts with one order. This one is yours.',
      'kirki-ecommerce',
    ),
    [
      <strong key="customer" css={scoped(styles.strong)}>
        {order.customer_name ?? __('A customer', 'kirki-ecommerce')}
      </strong>,
      <strong key="total" css={scoped(styles.strong)}>
        {order.base_total_money_object.display}
      </strong>,
      <strong key="order">{order.order_number}</strong>,
    ],
  );

  return (
    <Card
      ref={cardRef}
      role="status"
      aria-label={__('Your first sale', 'kirki-ecommerce')}
      cssOverride={styles.card}
    >
      <Flex align="center" justify="space-between" gap={4} wrap="wrap">
        <Flex align="center" gap={3} cssOverride={styles.message}>
          <FirstSaleIcon />
          <Flex direction="column" gap={1}>
            <Text variant="small" weight="semibold">
              {__('You made your first sale!', 'kirki-ecommerce')}
            </Text>
            <Text variant="small" color="secondary">
              {description}
            </Text>
          </Flex>
        </Flex>
        <Flex align="center" gap={2}>
          <Button variant="primary" onClick={handleFulfill}>
            {__('Fulfill order', 'kirki-ecommerce')}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={__('Close', 'kirki-ecommerce')}
            onClick={() => dismiss()}
          >
            <X size={16} aria-hidden="true" />
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

FirstSaleCard.displayName = 'FirstSaleCard';

export default FirstSaleCard;

const dotEnter = keyframes({
  from: { transform: 'scale(0)', opacity: 0 },
  to: { transform: 'scale(1)', opacity: 1 },
});

const dotPulse = keyframes({
  '0%': { transform: 'scale(1)' },
  '35%': { transform: 'scale(0.6)' },
  '100%': { transform: 'scale(1)' },
});

const POP_EASING = 'cubic-bezier(.3, 1.6, .5, 1)';

const styles = defineStyles({
  card: {
    padding: theme.spacing[4],
    '&:hover [data-first-sale-dot]': {
      animation: `${dotPulse} 0.45s ${POP_EASING} both`,
    },
  },
  message: {
    flex: '1 1 320px',
    minWidth: 0,
  },
  icon: {
    flex: 'none',
    display: 'block',
    width: '36px',
    height: '36px',
    overflow: 'visible',
  },
  bag: {
    fill: theme.colors.icon.brand,
  },
  dot: {
    fill: theme.colors.icon.critical,
    transformBox: 'fill-box',
    transformOrigin: '50% 50%',
    animation: `${dotEnter} 0.45s ${POP_EASING} 0.35s both`,
  },
  strong: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
