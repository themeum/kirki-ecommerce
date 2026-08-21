import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, itemCenter, scopedMerge, uiFocusRing } from '@/theme/mixins';
import type { LabelFieldProps, SelectOption, SelectState } from '@/types/components/common';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type GroupedValues = Record<string, (string | number)[]>;

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
  dropdownFooter?: ReactNode;
  /** Square off the bottom edge so the trigger reads as one surface with the panel below it. */
  isAttached?: boolean;
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
    onChange = noop,
    onClose = noop,
    label,
    helpText,
    error,
    checkboxField,
    dropdownHeader,
    dropdownFooter,
    isAttached,
  } = props;

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

  const handleOptionClick = (
    option: string | number,
    groupName: string,
    isRequired?: boolean,
  ) => {
    if (isRequired) {
      return;
    }

    let newValues = selectedValues[groupName];
    if (selectedValues[groupName]?.includes(option)) {
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
    <Field data-invalid={error ? true : undefined}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-error={error ? 'true' : undefined}
            css={scopedMerge(
              styles.trigger,
              isAttached && styles.triggerAttached,
              error && styles.triggerError,
            )}
          >
            <Text variant="small" color="secondary">{placeholder}</Text>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          cssOverride={dropdownFooter ? styles.contentWithFooter : styles.contentWithoutFooter}
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
                <FieldLabel
                  cssOverride={styles.headingLabel}
                  infoText={option?.infoText}
                >
                  {String(option.heading)}
                </FieldLabel>
              </DropdownMenuLabel>
            ) : (
              <DropdownMenuItem
                key={index}
                onSelect={() =>
                  handleOptionClick(
                    option.value,
                    String(option.group ?? ''),
                    option.isRequired,
                  )
                }
              >
                <Flex gap={2} align="center">
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
                      onChange={() =>
                        handleOptionClick(
                          option.value,
                          String(option?.group ?? ''),
                          option?.isRequired,
                        )
                      }
                    />
                  ) : (
                    option.title
                  )}
                  {option?.isRequired && (
                    <Badge variant="destructive">
                      {__('Required', 'kirki-ecommerce')}
                    </Badge>
                  )}
                </Flex>
              </DropdownMenuItem>
            ),
          )}
          {dropdownFooter && (
            <Flex cssOverride={styles.footer}>
              <ActionGroup>
                <Button
                  variant="outline"
                  onClick={handleSelectionClose}
                >
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSelectionClose}
                >
                  {__('Add', 'kirki-ecommerce')}
                </Button>
              </ActionGroup>
            </Flex>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
      {typeof error === 'string' && <FieldError>{error}</FieldError>}
    </Field>
  );
};

GroupSelect.displayName = 'GroupSelect';

export default GroupSelect;

const styles = defineStyles({
  trigger: {
    width: '100%',
    minHeight: '36px',
    border: `1px solid ${theme.colors.border.default}`,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    justifyContent: 'space-between',
    ...itemCenter(),
    gap: theme.spacing[2],
    ...theme.typography.paragraph(),
    cursor: 'pointer',
    textAlign: 'left',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.border.default,
      ...uiFocusRing(theme),
    },
  },
  triggerAttached: {
    borderRadius: `${theme.radius.lg} ${theme.radius.lg} ${theme.radius.none} ${theme.radius.none}`,
    borderBottom: 'none',
  },
  triggerError: {
    border: `1px solid ${theme.colors.border.critical}`,
    boxShadow: 'none',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.border.critical,
      ...uiFocusRing(theme, theme.colors.border.critical),
    },
  },
  contentWithFooter: {
    paddingBottom: theme.spacing[0],
  },
  contentWithoutFooter: {
    paddingBottom: theme.spacing[1],
  },
  footer: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]} ${theme.spacing[2]} ${theme.spacing[3]}`,
    borderTop: `1px solid ${theme.colors.border.default}`,
    bottom: 0,
    position: 'sticky',
    backgroundColor: theme.colors.background.surface,
  },
  headingLabel: {
    ...theme.typography.small('medium'),
    color: theme.colors.text.subdued,
  },
});
