import { useState, type ReactNode } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import classNames from 'classnames';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

type ComboboxOption = {
  label: string;
  value: string;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  error?: boolean;
  multiple?: boolean;
  className?: string;
};

const Combobox = ({
  options,
  value,
  onChange = () => {},
  placeholder = __('Select...', 'kirki-ecommerce'),
  searchPlaceholder = __('Search...', 'kirki-ecommerce'),
  emptyText = __('No results found.', 'kirki-ecommerce'),
  disabled = false,
  error = false,
  multiple = false,
  className,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selectedValues = multiple
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === 'string' && value
      ? [value]
      : [];

  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value),
  );

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const nextValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((item) => item !== optionValue)
        : [...selectedValues, optionValue];
      onChange(nextValues);
      return;
    }

    onChange(optionValue === value ? '' : optionValue);
    setOpen(false);
  };

  const handleRemove = (optionValue: string) => {
    if (!multiple) {
      return;
    }
    onChange(selectedValues.filter((item) => item !== optionValue));
  };

  const triggerLabel = (): ReactNode => {
    if (multiple) {
      if (selectedOptions.length === 0) {
        return (
          <span className={`${CLASS_PREFIX}-ui-combobox-placeholder`}>
            {placeholder}
          </span>
        );
      }

      return (
        <span className={`${CLASS_PREFIX}-ui-combobox-tags`}>
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className={`${CLASS_PREFIX}-ui-combobox-tag`}
            >
              {option.label}
              <button
                type="button"
                className={`${CLASS_PREFIX}-ui-combobox-tag-remove`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemove(option.value);
                }}
                aria-label={__('Remove', 'kirki-ecommerce')}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </span>
      );
    }

    if (selectedOptions.length > 0) {
      return selectedOptions[0].label;
    }

    return (
      <span className={`${CLASS_PREFIX}-ui-combobox-placeholder`}>
        {placeholder}
      </span>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          data-error={error ? 'true' : undefined}
          className={classNames(
            `${CLASS_PREFIX}-ui-combobox-trigger`,
            error && `${CLASS_PREFIX}-ui-combobox-trigger--error`,
            className,
          )}
        >
          <span className={`${CLASS_PREFIX}-ui-combobox-value`}>
            {triggerLabel()}
          </span>
          <ChevronsUpDown
            size={16}
            className={`${CLASS_PREFIX}-ui-combobox-chevron`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={`${CLASS_PREFIX}-ui-combobox-content`}
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <span
                      className={classNames(
                        `${CLASS_PREFIX}-ui-command-item-check`,
                        !isSelected &&
                          `${CLASS_PREFIX}-ui-command-item-check--empty`,
                      )}
                    >
                      {isSelected && <Check size={14} />}
                    </span>
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

Combobox.displayName = 'Combobox';

export default Combobox;
export type { ComboboxOption, ComboboxProps };
