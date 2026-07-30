import type { CSSObject } from '@emotion/react';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronsUpDown } from 'lucide-react';

import Button from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Checkbox from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import { theme } from '@/theme';
import { itemCenter, uiFocusRing, scoped, scopedMerge } from '@/theme/mixins';
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
    <Field data-invalid={error ? true : undefined}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-error={error ? 'true' : undefined}
            css={scopedMerge(styles.trigger, error && styles.triggerError)}
          >
            <span css={scoped(styles.placeholder)}>{placeholder}</span>
            <ChevronsUpDown size={16} css={scoped(styles.chevron)} aria-hidden="true" />
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
                <FieldLabel cssOverride={styles.headingLabel}>
                  {String(option.heading)}
                </FieldLabel>
                {option?.infoText && (
                  <FieldDescription>{option.infoText}</FieldDescription>
                )}
              </DropdownMenuLabel>
            ) : (
              <DropdownMenuItem
                key={index}
                disabled={option.isRequired}
                onSelect={() =>
                  handleOptionClick(option.value, String(option.group ?? ''))
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
                  variant="secondary"
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

const styles = {
  trigger: ({
    width: '100%',
    minHeight: '36px',
    border: `1px solid ${theme.colors.border.default}`,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    boxSizing: 'border-box',
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
  } satisfies CSSObject),
  triggerError: ({
    border: `1px solid ${theme.colors.border.critical}`,
    boxShadow: 'none',
    '&:focus-visible, &[data-state="open"]': {
      borderColor: theme.colors.border.critical,
      ...uiFocusRing(theme, theme.colors.border.critical),
    },
  } satisfies CSSObject),
  placeholder: ({
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.colors.text.secondary,
    opacity: 0.8,
  } satisfies CSSObject),
  chevron: ({
    flexShrink: 0,
    color: theme.colors.text.secondary,
    opacity: 0.5,
  } satisfies CSSObject),
  contentWithFooter: ({
    paddingBottom: theme.spacing[0],
  } satisfies CSSObject),
  contentWithoutFooter: ({
    paddingBottom: theme.spacing[1],
  } satisfies CSSObject),
  footer: ({
    padding: `${theme.spacing[2]} ${theme.spacing[4]} ${theme.spacing[2]} ${theme.spacing[3]}`,
    borderTop: `1px solid ${theme.colors.border.default}`,
    bottom: 0,
    position: 'sticky',
    backgroundColor: theme.colors.background.surface,
  } satisfies CSSObject),
  headingLabel: ({
    ...theme.typography.small('medium'),
    color: theme.colors.text.subdued,
  } satisfies CSSObject),
};
