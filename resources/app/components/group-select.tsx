import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { type Theme } from '@emotion/react';

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
import { Separator } from '@/components/ui/separator';
import { theme } from '@/theme';
import {
  fontGeneralSettings,
  itemCenter,
  scoped,
  uiFocusRing,
} from '@/theme/mixins';
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
  checkboxField?: boolean;
  dropdownHeader?: ReactNode;
  dropdownFooter?: boolean | ReactNode;
};

/**
 * Grouped multi-select dropdown with a button trigger.
 *
 * @param props Component props.
 *
 * @returns Group select element.
 * @since 1.0.0
 */
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
    <Flex direction="column" gap={8}>
      {label && (
        <Label error={Boolean(error)} helpText={error ? error : helpText}>
          {label}
        </Label>
      )}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-error={error ? 'true' : undefined}
            css={[styles.trigger, error && styles.triggerError]}
          >
            <span css={styles.placeholder}>{placeholder}</span>
            <ChevronsUpDown size={16} css={styles.chevron} aria-hidden="true" />
          </button>
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
                    <Badge
                      text={__('Required', 'kirki-ecommerce')}
                      type="trashed"
                    />
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
    </Flex>
  );
};

GroupSelect.displayName = 'GroupSelect';

export default GroupSelect;

const styles = {
  trigger: scoped({
    width: '100%',
    minHeight: '36px',
    border: `1px solid ${theme.colors.border.default}`,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    boxSizing: 'border-box',
    justifyContent: 'space-between',
    ...itemCenter(),
    gap: theme.spacing.md,
    ...fontGeneralSettings(theme as Theme),
    cursor: 'pointer',
    textAlign: 'left',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.border.default,
      ...uiFocusRing(theme as Theme),
    },
  }),
  triggerError: scoped({
    border: `1px solid ${theme.colors.border.critical}`,
    boxShadow: 'none',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.border.critical,
      ...uiFocusRing(theme as Theme, theme.colors.border.critical),
    },
  }),
  placeholder: scoped({
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.colors.text.secondary,
    opacity: 0.8,
  }),
  chevron: scoped({
    flexShrink: 0,
    color: theme.colors.text.secondary,
    opacity: 0.5,
  }),
};
