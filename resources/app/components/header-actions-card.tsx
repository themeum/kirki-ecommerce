import DropdownButton from '@/components/dropdown-button';
import Button from '@/components/ui/button';
import { PlusIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
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
    handleOptionSelect = () => {},
  } = props;
  return (
    <>
      <Flex direction="column" gap={1}>
        <Flex align="center">
          <Text weight="semibold">{header}</Text>
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
        <Text color="secondary">{subHeader}</Text>
      </Flex>
    </>
  );
};

export default HeaderActionsCard;
