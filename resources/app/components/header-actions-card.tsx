import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { PlusIcon } from 'lucide-react';

type HeaderActionsCardProps = {
  'data-search-id'?: string;
  header?: string;
  subHeader?: string;
  buttonText?: string;
  onAdd?: () => void;
  hideButton?: boolean;
  dropDownButton?: boolean;
  handleOptionSelect?: (value: string | number | (string | number)[]) => void;
};

const HeaderActionsCard = (props: HeaderActionsCardProps) => {
  const { header, subHeader, buttonText, onAdd, hideButton = false } = props;
  return (
    <>
      <Flex direction="column" gap={1} data-search-id={props['data-search-id']}>
        <Flex align="center">
          <Text variant="heading6" weight="semibold" color="primary">
            {header}
          </Text>
          {!hideButton && (
            <ActionGroup>
              <Button
                variant="secondary"
                size="sm"
                onClick={onAdd}
                cssOverride={{ color: theme.colors.text.emphasis }}
              >
                <PlusIcon />
                {buttonText}
              </Button>
            </ActionGroup>
          )}
        </Flex>
        <Text variant="small" color="secondary">
          {subHeader}
        </Text>
      </Flex>
    </>
  );
};

export default HeaderActionsCard;
