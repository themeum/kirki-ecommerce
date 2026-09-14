import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Palette, PlusIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import {
  type AddVariationFormInput,
  type AddVariationFormPayload,
  AddVariationFormSchema,
  useCreateAttributeMutation,
} from '@/features/products';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import type { ButtonState } from '@/types/components/common';
import { __ } from '@/wpi18n';

type VariationType = 'color' | 'list';

type AddVariationPopoverProps = {
  onClose: () => void;
};

const AddVariationPopover = ({ onClose }: AddVariationPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [variationType, setVariationType] = useState<VariationType | null>(null);
  const pendingTypeRef = useRef<VariationType | null>(null);
  const createMutation = useCreateAttributeMutation();

  const form = useForm<AddVariationFormInput, unknown, AddVariationFormPayload>({
    resolver: zodResolver(AddVariationFormSchema),
    defaultValues: {
      name: '',
      type: variationType,
    },
  });

  const nameValue = form.watch('name');

  const handleSelectType = (type: VariationType) => {
    pendingTypeRef.current = type;
  };

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);

    if (!next) {
      form.reset({ name: '', type: variationType });
      onClose();
    }
  };

  /**
   * The menu hands focus back to the trigger as it unmounts, and that lands
   * outside the popover — enough to dismiss it had it opened alongside the
   * menu. Opening a tick after the menu has released focus keeps the two
   * layers from overlapping at all.
   */
  const handleMenuCloseAutoFocus = () => {
    const pendingType = pendingTypeRef.current;

    if (!pendingType) {
      return;
    }

    pendingTypeRef.current = null;

    window.setTimeout(() => {
      setVariationType(pendingType);
      form.reset({ name: '', type: pendingType });
      setIsOpen(true);
    }, 0);
  };

  const handleSubmit = async (payload: AddVariationFormPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      handleOpenChange(false);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
      form.setValue('name', '');
    }
  };

  const handleOpenAutoFocus = (event: Event) => {
    event.preventDefault();

    const content = event.currentTarget;

    if (!(content instanceof HTMLElement)) {
      return;
    }

    content.querySelector('input')?.focus();
  };

  const buttonState: ButtonState = nameValue === '' ? 'disabled' : '';

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <PopoverAnchor asChild>
            <Button variant="secondary">
              <PlusIcon />
              {__('Add Variation', 'kirki-ecommerce')}
            </Button>
          </PopoverAnchor>
        </DropdownMenuTrigger>
        <DropdownMenuContent onCloseAutoFocus={handleMenuCloseAutoFocus}>
          <DropdownMenuItem onClick={() => handleSelectType('color')}>
            <Palette size={16} /> {__('Color', 'kirki-ecommerce')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectType('list')}>
            <Package size={16} /> {__('List', 'kirki-ecommerce')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PopoverContent
        align="end"
        cssOverride={styles.content}
        onOpenAutoFocus={handleOpenAutoFocus}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Flex direction="column" gap={4}>
              <TextField
                name="name"
                label={__('Title', 'kirki-ecommerce')}
                placeholder={__(
                  variationType === 'color' ? 'e.g Color' : 'e.g Material',
                  'kirki-ecommerce',
                )}
              />
              <Flex gap={2} justify="flex-end">
                <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={createMutation.isPending}
                  disabled={buttonState === 'disabled'}
                >
                  {__('Save', 'kirki-ecommerce')}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
};

AddVariationPopover.displayName = 'AddVariationPopover';

export default AddVariationPopover;

const styles = defineStyles({
  content: {
    width: '280px',
    maxWidth: '280px',
    padding: theme.spacing[4],
  },
});
