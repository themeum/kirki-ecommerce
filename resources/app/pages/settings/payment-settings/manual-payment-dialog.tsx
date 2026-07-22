import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import RichTextField from '@/components/form/rich-text-field';
import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { CLASS_PREFIX } from '@/conf';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Flex from '@/components/ui/flex';
import {
  ManualPaymentFormSchema,
  manualPaymentDefaultValues,
  type ManualPaymentFormValues,
} from '@/schemas/forms/manual-payment-form';
import {
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
} from '@/services/payment';
import type { PaymentMethod } from '@/types';
import { __ } from '@/wpi18n';

type ManualPaymentPopupProps = {
  openPopup: boolean;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
  editingMethod: PaymentMethod | null;
  setEditingMethod: Dispatch<SetStateAction<PaymentMethod | null>>;
};

const getIconUrl = (method: PaymentMethod | null) => {
  if (!method?.icon) {
    return '';
  }
  if (typeof method.icon === 'string') {
    return method.icon;
  }
  return '';
};

const ManualPaymentPopup = (props: ManualPaymentPopupProps) => {
  const { openPopup, setOpenPopup, editingMethod, setEditingMethod } = props;
  const [iconPreview, setIconPreview] = useState<string | null>('');

  const { mutateAsync: createMethod, isPending: isCreating } =
    useCreatePaymentMethodMutation();
  const { mutateAsync: updateMethod, isPending: isUpdating } =
    useUpdatePaymentMethodMutation();
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<ManualPaymentFormValues>({
    resolver: zodResolver(ManualPaymentFormSchema),
    defaultValues: manualPaymentDefaultValues,
  });

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    const iconUrl = getIconUrl(editingMethod);
    setIconPreview(iconUrl);
    form.reset({
      name: editingMethod?.name ?? '',
      icon: iconUrl,
      instructions:
        (editingMethod?.instructions as string) ||
        ((editingMethod as PaymentMethod & { description?: string })
          ?.description ??
          ''),
      is_manual: true,
      is_enabled: editingMethod?.is_enabled ?? true,
    });
  }, [openPopup, editingMethod, form]);

  const handleClose = () => {
    setIconPreview('');
    form.reset(manualPaymentDefaultValues);
    setOpenPopup(false);
    setEditingMethod(null);
  };

  const handleSaveOrUpdateData = async (values: ManualPaymentFormValues) => {
    const iconValue =
      typeof values.icon === 'object' && values.icon !== null
        ? ((values.icon as { url?: string }).url ?? '')
        : (values.icon ?? '');

    const payload = {
      ...values,
      icon: iconValue,
      is_manual: true,
    };

    try {
      if (editingMethod) {
        await updateMethod({
          id: editingMethod.id,
          data: payload as Record<string, unknown>,
        });
      } else {
        await createMethod(payload as Record<string, unknown>);
      }
      handleClose();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return (
    <Dialog
      open={openPopup}
      onOpenChange={(next) => {
        if (!next) {
          handleClose();
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {__('Add Manual Payment Method', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveOrUpdateData)}>
            <div className={`${CLASS_PREFIX}-ui-dialog-body`}>
              <Flex direction="column" gap={16}>
                <TextField
                  name="name"
                  label={__('Method Name', 'kirki-ecommerce')}
                  placeholder={__(
                    'e.g. Cash on Delivery (COD)',
                    'kirki-ecommerce',
                  )}
                />
                <ThumbnailField
                  name="icon"
                  label={__('Icon', 'kirki-ecommerce')}
                  description={__('Icon', 'kirki-ecommerce')}
                  placeholder={__(
                    'Recommended image size: 48x48',
                    'kirki-ecommerce',
                  )}
                  valueAs="object"
                  previewUrl={iconPreview}
                  onPreviewChange={setIconPreview}
                  getPreviewUrl={(value) =>
                    typeof value === 'string' ? value : undefined
                  }
                />
                <RichTextField
                  name="instructions"
                  label={__('Payment Instructions', 'kirki-ecommerce')}
                  placeholder={__(
                    'Type instructions related to payment method',
                    'kirki-ecommerce',
                  )}
                  description={__(
                    'Provide clear, step-by-step instructions on how to complete the payment',
                    'kirki-ecommerce',
                  )}
                />
              </Flex>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  size="sm"
                >
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                size="sm"
              >
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ManualPaymentPopup.displayName = 'ManualPaymentPopup';

export default ManualPaymentPopup;
