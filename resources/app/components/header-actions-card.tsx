import { PlusIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import ActionGroup from '@/components/ui/action-group';
import type { ButtonVariant } from '@/components/ui/button';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';

type HeaderActionsCardProps = {
  'data-search-id'?: string;
  header?: string;
  subHeader?: string;
  buttonText?: string;
  buttonVariant?: ButtonVariant;
  onAdd?: () => void;
  actions?: ReactNode;
  hideButton?: boolean;
  dropDownButton?: boolean;
  handleOptionSelect?: (value: string | number | (string | number)[]) => void;
};

const HeaderActionsCard = (props: HeaderActionsCardProps) => {
  const {
    header,
    subHeader,
    buttonText,
    onAdd,
    actions,
    buttonVariant = 'secondary',
    hideButton = false,
  } = props;
  return (
    <>
      <Flex gap={4} data-search-id={props['data-search-id']} align="flex-start">
        <Flex direction="column">
          <Text variant="heading6" weight="semibold" color="primary">
            {header}
          </Text>
          <Text variant="small" color="secondary">
            {subHeader}
          </Text>
        </Flex>
        {actions && <ActionGroup>{actions}</ActionGroup>}
        {!actions && !hideButton && (
          <ActionGroup>
            <Button variant={buttonVariant} size="sm" onClick={onAdd}>
              <PlusIcon />
              {buttonText}
            </Button>
          </ActionGroup>
        )}
      </Flex>
    </>
  );
};

export default HeaderActionsCard;
