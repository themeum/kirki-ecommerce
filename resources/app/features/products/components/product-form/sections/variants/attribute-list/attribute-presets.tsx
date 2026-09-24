import { useState } from 'react';

import Button from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import Flex from '@/components/ui/flex';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Attribute } from '@/features/products/schemas/catalog/attribute';
import { PlusIcon } from '@/icons';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type AttributePresetsProps = {
  presets: Attribute[];
  overflow: Attribute[];
  disabled?: boolean;
  onPick: (attribute: Attribute) => void;
  onAddNew: () => void;
};

/**
 * The row of one-click attribute buttons under the variation cards, ending in
 * `+ Add`. With more attributes than fit as presets, `+ Add` opens a
 * searchable list of the rest with "Add new" pinned at the bottom; otherwise
 * it goes straight to a new attribute.
 *
 * @param props Component props.
 *
 * @returns AttributePresets element.
 * @since 1.0.0
 */
const AttributePresets = ({
  presets,
  overflow,
  disabled = false,
  onPick,
  onAddNew,
}: AttributePresetsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const addButton = (
    <Button
      variant="ghost"
      disabled={disabled}
      onClick={overflow.length > 0 ? undefined : onAddNew}
    >
      <PlusIcon />
      {__('Add', 'kirki-ecommerce')}
    </Button>
  );

  return (
    <Flex gap={2} wrap="wrap" align="center">
      {presets.map((attribute) => (
        <Button
          key={attribute.id}
          variant="tertiary"
          disabled={disabled}
          aria-label={sprintf(__('Add %s variation', 'kirki-ecommerce'), attribute.name)}
          onClick={() => onPick(attribute)}
        >
          <PlusIcon />
          {attribute.name}
        </Button>
      ))}
      {overflow.length > 0 ? (
        <Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>{addButton}</PopoverTrigger>
          <PopoverContent align="start" cssOverride={styles.content}>
            <Command>
              <CommandInput placeholder={__('Search attributes', 'kirki-ecommerce')} />
              <CommandList>
                <CommandEmpty>{__('No attributes found.', 'kirki-ecommerce')}</CommandEmpty>
                <CommandGroup>
                  {overflow.map((attribute) => (
                    <CommandItem
                      key={attribute.id}
                      value={attribute.name}
                      onSelect={() => {
                        setIsOpen(false);
                        onPick(attribute);
                      }}
                    >
                      {attribute.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <div css={scoped(styles.footer)}>
              <Button
                variant="tertiary"
                cssOverride={styles.footerButton}
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
              >
                <PlusIcon />
                {__('Add new', 'kirki-ecommerce')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        addButton
      )}
    </Flex>
  );
};

AttributePresets.displayName = 'AttributePresets';

export default AttributePresets;

const styles = defineStyles({
  content: {
    width: '280px',
    padding: 0,
    overflow: 'hidden',
    borderRadius: theme.radius.lg,
  },
  footer: {
    padding: theme.spacing[1],
    borderTop: `1px solid ${theme.colors.border.default}`,
  },
  footerButton: {
    justifyContent: 'flex-start',
    width: '100%',
    height: 'auto',
    gap: theme.spacing[2],
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    borderRadius: theme.radius.md,
    ...theme.typography.small('medium'),
  },
});
