import type { CSSObject } from '@emotion/react';
import { type ReactNode } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type OptionAccordionProps = {
  header?: ReactNode;
  titleAdornment?: ReactNode;
  subHeader?: string;
  leftIcon?: ReactNode;
  children?: ReactNode;
  rightActions?: ReactNode;
  variant?: 'shipping' | 'email' | 'inactive';
  enabled?: boolean;
  disabled?: boolean;
  expandable?: boolean;
  open?: boolean;
  cssOverride?: CSSObject;
};

const OptionAccordion = (props: OptionAccordionProps) => {
  const {
    header,
    titleAdornment = null,
    subHeader,
    leftIcon,
    children,
    rightActions = null,
    variant,
    enabled = true,
    disabled = false,
    expandable = true,
    open = false,
    cssOverride,
  } = props;

  const isOpen = open && expandable;

  return (
    <div
      css={scoped(
        mergeCss(styles.wrapper, variant === 'shipping' && styles.shippingWrapper, cssOverride),
      )}
    >
      <Accordion
        cssOverride={styles.accordion}
        hideSeparator={true}
        hasBottomSpace={false}
        rightActions={rightActions}
        defaultValue={isOpen ? 'option-item' : undefined}
      >
        <AccordionItem value={isOpen ? 'option-item' : undefined}>
          <AccordionTrigger
            cssOverride={mergeCss(styles.trigger, variant === 'shipping' && styles.shippingTrigger)}
            gap={4}
            disabled={disabled || !expandable}
            hideChevron={!expandable}
          >
            <Flex gap={4} align="center">
              {leftIcon}
              <Flex direction="column" gap={2}>
                <Flex gap={1} align="center" cssOverride={{ height: 24 }}>
                  <Text weight="semibold" variant="small" color="primary">
                    {header}
                  </Text>
                  {titleAdornment}
                  {!enabled && (
                    <Badge variant="destructive">{__('Inactive', 'kirki-ecommerce')}</Badge>
                  )}
                </Flex>
                {subHeader && (
                  <Text variant="small" color="secondary">
                    {subHeader}
                  </Text>
                )}
              </Flex>
            </Flex>
          </AccordionTrigger>
          {expandable && (
            <AccordionContent>
              <Card
                cssOverride={mergeCss(
                  cardStyles.darkCard,
                  styles.contentCard,
                  variant === 'shipping' && styles.shippingCard,
                  variant === 'email' && styles.emailCard,
                )}
                data-option-accordion-card="true"
              >
                <CardContent
                  cssOverride={mergeCss(
                    cardStyles.innerCardContent,
                    variant === 'shipping' && styles.shippingContent,
                  )}
                >
                  {children}
                </CardContent>
              </Card>
            </AccordionContent>
          )}
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default OptionAccordion;

const styles = defineStyles({
  wrapper: {
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.border.secondary}`,
  },
  accordion: {
    width: '100%',
  },
  trigger: {
    padding: `${theme.spacing[3]} ${theme.spacing[4]} ${theme.spacing[3]} ${theme.spacing[4]}`,
  },
  contentCard: {
    borderRadius: theme.radius.xl,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'none',
  },
  shippingContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing[0],
  },
  shippingWrapper: {
    borderColor: theme.colors.border.secondary,
    overflow: 'hidden',
  },
  shippingCard: {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: theme.radius.none,
  },
  emailCard: {
    border: 'none',
  },
  shippingTrigger: {
    '&:has(button[data-state="open"])': {
      borderBottom: `1px solid ${theme.colors.border.secondary}`,
    },
    '& button[data-state="open"] [data-accordion-chevron]': {
      visibility: 'hidden',
    },
    '&:hover button[data-state="open"] [data-accordion-chevron], &:focus-within button[data-state="open"] [data-accordion-chevron]':
      {
        visibility: 'visible',
      },
  },
});
