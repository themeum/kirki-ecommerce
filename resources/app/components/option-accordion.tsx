import { useState, type ReactNode } from 'react';

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
import { scoped } from '@/theme/mixins';
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
    <div css={styles.wrapper}>
      <Accordion
        css={styles.accordion}
        hideSeparator={true}
        hasBottomSpace={false}
        rightActions={rightActions}
      >
        <AccordionItem>
          <AccordionTrigger
            css={styles.trigger}
            gap={16}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Flex gap={8} style={{ alignItems: 'center' }}>
              {leftIcon}
              <Flex direction="column" gap={6}>
                <Flex gap={8} style={{ alignItems: 'center' }}>
                  <Text weight="medium" color={headerColor}>
                    {header}
                  </Text>
                  {!state && (
                    <Badge
                      text={__('Inactive', 'kirki-ecommerce')}
                      type="trashed"
                    />
                  )}
                </Flex>
                <Text variant="small" color="secondary">
                  {subHeader}
                </Text>
              </Flex>
            </Flex>
          </AccordionTrigger>
          <AccordionContent>
            <Card css={[cardStyles.darkCard, styles.contentCard]}>
              <CardContent>{children}</CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default OptionAccordion;

const styles = {
  wrapper: scoped({
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.icon.inverse}`,
  }),
  accordion: scoped({
    width: '100%',
  }),
  trigger: scoped({
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
  }),
  contentCard: scoped({
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
    display: 'flex',
    flexDirection: 'column',
  }),
};
