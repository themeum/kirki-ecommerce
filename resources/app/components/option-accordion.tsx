import { useState, type ReactNode } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { scoped, mergeCss, defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type OptionAccordionProps = {
  header?: string;
  subHeader?: string;
  leftIcon?: ReactNode;
  children?: ReactNode;
  rightActions?: ReactNode;
  variant?: 'shipping' | 'inactive' | string;
  state?: boolean;
};

const OptionAccordion = (props: OptionAccordionProps) => {
  const {
    header,
    subHeader,
    leftIcon,
    children,
    rightActions = null,
    variant,
    state = true,
  } = props;
  const [isHovered, setIsHovered] = useState(false);

  const isEmphasis = Boolean(variant === 'shipping' && state && isHovered);
  const headerColor = !state ? 'disabled' : isEmphasis ? 'emphasis' : 'primary';

  return (
    <div css={scoped(styles.wrapper)}>
      <Accordion
        cssOverride={styles.accordion}
        hideSeparator={true}
        hasBottomSpace={false}
        rightActions={rightActions}
      >
        <AccordionItem>
          <AccordionTrigger
            cssOverride={styles.trigger}
            gap={4}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Flex gap={2} align="center">
              {leftIcon}
              <Flex direction="column" gap={2}>
                <Flex gap={2} align="center">
                  <Text weight="medium" color={headerColor}>
                    {header}
                  </Text>
                  {!state && (
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
              <CardContent>{children}</CardContent>
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
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
  },
  contentCard: {
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
    display: 'flex',
    flexDirection: 'column',
  },
});
