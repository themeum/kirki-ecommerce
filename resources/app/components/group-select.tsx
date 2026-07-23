import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

import Button from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import Searchbox from '@/components/ui/searchbox';
import { Separator } from '@/components/ui/separator';
import type { LabelFieldProps, SelectOption, SelectState } from '@/types';
import { __ } from '@/wpi18n';

type GroupedValues = Record<string, Array<string | number>>;

type GroupSelectOption = SelectOption & {
  isRequired?: boolean;
  isDefault?: boolean;
  heading?: string | boolean;
};

type GroupSelectProps = LabelFieldProps & {
  valueArray?: GroupedValues;
  optionsArray?: GroupSelectOption[];
  placeholder?: string;
  onChange?: (values: GroupedValues) => void;
  onClose?: () => void;
  state?: SelectState;
  style?: CSSProperties;
  leftIcon?: ReactNode;
  checkboxField?: boolean;
  dropdownHeader?: ReactNode;
  dropdownFooter?: boolean | ReactNode;
};

const GroupSelect = (props: GroupSelectProps) => {
  const {
    valueArray = {},
    optionsArray = [],
    placeholder = __('Type to add schemas..', 'kirki-ecommerce'),
    onChange = () => {},
    onClose = () => {},
    label,
    helpText,
    error,
    leftIcon,
    checkboxField,
    dropdownHeader,
    dropdownFooter,
  } = props;

  const labelFontStyle = {
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '21px',
  };

  const [selectedValues, setSelectedValues] = useState<GroupedValues>(valueArray);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSelectedValues(valueArray);
  }, [valueArray]);

  const handleSelectionClose = () => {
    onChange(selectedValues);
    if (onClose) {
      onClose();
    }
    setIsOpen(false);
  };

  const handleOptionClick = (option: string | number, groupName: string) => {
    let newValues = selectedValues[groupName];
    if (
      selectedValues[groupName] &&
      selectedValues[groupName].includes(option)
    ) {
      newValues = selectedValues[groupName].filter((item) => item !== option);
      if (newValues.length === 0) {
        const fullData = { ...selectedValues };
        delete fullData[groupName];
        setSelectedValues(fullData);
        onChange(fullData);
        return;
      }
    } else {
      newValues = [...(selectedValues[groupName] || []), option];
    }
    onChange({ ...selectedValues, [groupName]: newValues });
    setSelectedValues((prev) => ({ ...prev, [groupName]: newValues }));
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div>
          <Searchbox
            leftIcon={leftIcon}
            placeholder={placeholder}
            label={label}
            error={error}
            helpText={helpText}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        style={{ paddingBottom: dropdownFooter ? '0' : '4px' }}
      >
        {dropdownHeader && (
          <DropdownMenuItem>
            <div>{dropdownHeader}</div>
            <Separator marginTop={4} marginBottom={4} />
          </DropdownMenuItem>
        )}
        {optionsArray.map((option, index) =>
          option?.heading ? (
            <DropdownMenuLabel key={index}>
              <Label
                text={String(option.heading)}
                infoText={option?.infoText}
                style={{ ...labelFontStyle, color: '#878593' }}
              />
            </DropdownMenuLabel>
          ) : (
            <DropdownMenuItem
              key={index}
              disabled={option.isRequired}
              onSelect={() =>
                handleOptionClick(option.value, String(option.group ?? ''))
              }
            >
              <Flex style={{ alignItems: 'center' }} gap={8}>
                {option.icon}
                {checkboxField ? (
                  <Checkbox
                    value={
                      option?.isDefault ||
                      option?.isRequired ||
                      (selectedValues[String(option.group)]?.includes(
                        option.value,
                      ) ??
                        false)
                    }
                    label={option?.title}
                    labelStyle={labelFontStyle}
                    onChange={() =>
                      handleOptionClick(
                        option.value,
                        String(option?.group ?? ''),
                      )
                    }
                  />
                ) : (
                  option.title
                )}
                {option?.isRequired && (
                  <Badge text={__('Required', 'kirki-ecommerce')} type="trashed" />
                )}
              </Flex>
            </DropdownMenuItem>
          ),
        )}
        {dropdownFooter && (
          <Flex
            style={{
              padding: '12px 16px 8px 12px',
              borderTop: '1px solid #E4E3E9',
              bottom: '0',
              position: 'sticky',
              backgroundColor: 'white',
            }}
          >
            <ActionGroup>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectionClose}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSelectionClose}
              >
                {__('Add', 'kirki-ecommerce')}
              </Button>
            </ActionGroup>
          </Flex>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

GroupSelect.displayName = 'GroupSelect';

export default GroupSelect;
