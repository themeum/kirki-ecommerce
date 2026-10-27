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
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type OptionAccordionProps = {
  header?: ReactNode;
  titleAdornment?: ReactNode;
  subHeader?: string;
  meta?: ReactNode;
  leftIcon?: ReactNode;
  children?: ReactNode;
  rightActions?: ReactNode;
  variant?: 'shipping' | 'email' | 'inactive';
  enabled?: boolean;
  disabled?: boolean;
  expandable?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  cssOverride?: CSSObject;
};

const OptionAccordion = (props: OptionAccordionProps) => {
  const {
    header,
    titleAdornment = null,
    subHeader,
    meta,
    leftIcon,
    children,
    rightActions = null,
    variant,
    enabled = true,
    disabled = false,
    expandable = true,
    open = false,
    onOpenChange,
    cssOverride,
  } = props;

  const isOpen = open && expandable;
  const isControlled = isDefined(onOpenChange);

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
        defaultValue={!isControlled && isOpen ? 'option-item' : undefined}
        value={isControlled ? (isOpen ? ['option-item'] : []) : undefined}
        onValueChange={
          isControlled ? (value) => onOpenChange(value.includes('option-item')) : undefined
        }
      >
        <AccordionItem value={isControlled || isOpen ? 'option-item' : undefined}>
          <AccordionTrigger
            cssOverride={mergeCss(styles.trigger, variant === 'shipping' && styles.shippingTrigger)}
            gap={4}
            disabled={disabled || !expandable}
            hideChevron={!expandable}
          >
            <Flex gap={4} align="center">
              {leftIcon}
              <Flex direction="column" gap={1}>
                <Flex gap={1} align="center" cssOverride={{ minHeight: 24 }}>
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
                {meta}
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
                    variant === 'email' && styles.emailContent,
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
    backgroundColor: theme.colors.background.surfaceAlt,
  },
  emailContent: {
    padding: theme.spacing[2],
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
