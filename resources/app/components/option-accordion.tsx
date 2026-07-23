import { useState, type ReactNode } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
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

  return (
    <div
      style={{
        borderRadius: theme.radius.xl,
        border: `1px solid ${theme.colors.icon.inverse}`,
      }}
    >
      <Accordion
        style={{ width: '100%' }}
        hideSeparator={true}
        hasBottomSpace={false}
        rightActions={rightActions}
      >
        <AccordionItem>
          <AccordionTrigger
            style={{ padding: `${theme.spacing.lg} ${theme.spacing['2xl']}` }}
            gap={16}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Text
              header={header}
              subHeader={subHeader}
              style={{ gap: '6px' }}
              leftIcon={leftIcon}
              badge={!state && <Badge text={__('Inactive', 'kirki-ecommerce')} type="trashed" />}
              type={!state ? 'disabled' : 'secondary'}
              emphasis={variant === 'shipping' && state && isHovered}
            />
          </AccordionTrigger>
          <AccordionContent>
            <Card
              css={styles.darkCard}
              style={{
                borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
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
  darkCard: scoped({
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
};
