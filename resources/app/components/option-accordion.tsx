import { useState, type ReactNode } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Badge from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Text from '@/components/ui/text';
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
        borderRadius: 'var(--decom-radius-rounded-xl)',
        border: '1px solid var(--decom-icon-inverse)',
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
            style={{ padding: 'var(--decom-spacing-3) var(--decom-spacing-4)' }}
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
              type="dark"
              style={{
                borderRadius:
                  'var(--decom-radius-rounded-none) var(--decom-radius-rounded-none) var(--decom-radius-rounded-lg) var(--decom-radius-rounded-lg)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {children}
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default OptionAccordion;
