import DropdownButton from '@/components/dropdown-button';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { PlusIcon } from '@/icons';
import { __ } from '@/wpi18n';

type HeaderActionsCardProps = {
  header?: string;
  subHeader?: string;
  buttonText?: string;
  onAdd?: () => void;
  hideButton?: boolean;
  dropDownButton?: boolean;
  handleOptionSelect?: (value: string | number | Array<string | number>) => void;
};

const HeaderActionsCard = (props: HeaderActionsCardProps) => {
  const {
    header,
    subHeader,
    buttonText,
    onAdd,
    hideButton = false,
    dropDownButton = false,
    handleOptionSelect = () => { },
  } = props;
  return (
    <>
      <Flex direction="column" gap={2}>
        <Flex align="center">
          <Text variant="heading6" weight="semibold" color="primary">{header}</Text>
          {!hideButton && (
            <ActionGroup>
              {dropDownButton ? (
                <DropdownButton
                  buttonProps={{
                    text: buttonText,
                    size: 'small',
                    type: 'secondary',
                    leftIcon: <PlusIcon />,
                    onClick: onAdd,
                  }}
                  size="small"
                  options={[
                    {
                      title: __('Color', 'kirki-ecommerce'),
                      value: 'color',
                    },
                    {
                      title: __('List', 'kirki-ecommerce'),
                      value: 'list',
                    },
                  ]}
                  onOptionSelect={(value) => handleOptionSelect(value)}
                />
              ) : (
                <Button variant="secondary" onClick={onAdd}>
                  <PlusIcon />
                  {buttonText}
                </Button>
              )}
            </ActionGroup>
          )}
        </Flex>
        <Text variant="small" color="secondary">{subHeader}</Text>
      </Flex>
    </>
  );
};

export default HeaderActionsCard;
