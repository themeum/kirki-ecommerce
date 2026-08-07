import { type ReactNode } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  subHeader?: string;
  leftIcon?: ReactNode;
  children?: ReactNode;
  rightActions?: ReactNode;
  variant?: 'shipping' | 'inactive' | string;
  enabled?: boolean;
  disabled?: boolean;
};

const OptionAccordion = (props: OptionAccordionProps) => {
  const {
    header,
    subHeader,
    leftIcon,
    children,
    rightActions = null,
    variant,
    enabled = true,
    disabled = false,
  } = props;

  return (
    <div css={scoped(styles.wrapper)}>
      <Accordion
        cssOverride={styles.accordion}
        hideSeparator={true}
        hasBottomSpace={false}
        rightActions={rightActions}
      >
        <AccordionItem>
          <AccordionTrigger cssOverride={styles.trigger} gap={4} disabled={disabled}>
            <Flex gap={3} align="center">
              {leftIcon}
              <Flex direction="column" gap={1}>
                <Flex gap={1} align="center" cssOverride={{ height: 24 }}>
                  <Text weight="semibold" variant="heading6" color="primary">
                    {header}
                  </Text>
                  {!enabled && (
                    <Badge variant="destructive">
                      {__('Inactive', 'kirki-ecommerce')}
                    </Badge>
                  )}
                </Flex>
                <Text variant="small" color="secondary">
                  {subHeader}
                </Text>
              </Flex>
            </Flex>
          </AccordionTrigger>
          <AccordionContent>
            <Card cssOverride={mergeCss(cardStyles.darkCard, styles.contentCard)}>
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
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default OptionAccordion;

const styles = defineStyles({
  wrapper: {
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.icon.inverse}`,
  },
  accordion: {
    width: '100%',
  },
  trigger: {
    padding: `${theme.spacing[3]} ${theme.spacing[1]} ${theme.spacing[3]} ${theme.spacing[4]}`,
  },
  contentCard: {
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
    display: 'flex',
    flexDirection: 'column',
  },
  shippingContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
  },
});
