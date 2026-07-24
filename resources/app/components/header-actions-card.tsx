import DropdownButton from '@/components/dropdown-button';
import Button from '@/components/ui/button';
import { PlusIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
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
      <Flex direction="column" gap={4}>
        <Flex style={{ alignItems: 'center' }}>
          <Text
            type="primary"
            header={header}
            style={{ gap: theme.spacing[3] }}
          />
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
                <Button size="sm" variant="secondary" onClick={onAdd}>
                  <PlusIcon />
                  {buttonText}
                </Button>
              )}
            </ActionGroup>
          )}
        </Flex>
        <Text type="primary" subHeader={subHeader} />
      </Flex>
    </>
  );
};

export default HeaderActionsCard;
