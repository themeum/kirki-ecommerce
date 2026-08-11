import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import NumberField from '@/components/form/number-field';
import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import ShippingBoxPreview from '@/components/shipping-box-preview/shipping-box-preview';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults } from '@/libs/zod';
import {
  type ShippingBoxFormInput,
  type ShippingBoxFormPayload,
  ShippingBoxFormSchema,
} from '@/schemas/forms/shipping-box-form';
import { useSettingsQuery } from '@/services/settings';
import {
  useCreateShippingBoxMutation,
  useUpdateShippingBoxMutation,
} from '@/services/shipping';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import type { ShippingBox } from '@/types';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type ShippingBoxPopupProps = {
  selectedItem?: ShippingBox | null;
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (id?: number) => void;
};

const UNIT_TO_PX: Record<string, number> = {
  cm: 10,
  in: 25.4,
};

const convertValue = (
  value: number | string | undefined,
  fromUnit: string | undefined,
  toUnit: string,
) => {
  if (!value || fromUnit === toUnit) {
    return value;
  }

  const valueInPx = Number(value) * UNIT_TO_PX[fromUnit ?? 'in'];
  return +(valueInPx / UNIT_TO_PX[toUnit]).toFixed(2);
};

const ShippingBoxPopup = ({
  selectedItem = null,
  isOpen,
  onClose = noop,
  onSave = noop,
}: ShippingBoxPopupProps) => {
  const { data: productSettingsData } = useSettingsQuery('product');
  const { mutateAsync: createBox, isPending: isCreating } =
    useCreateShippingBoxMutation();
  const { mutateAsync: updateBox, isPending: isUpdating } =
    useUpdateShippingBoxMutation();
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<ShippingBoxFormInput, unknown, ShippingBoxFormPayload>({
    resolver: zodResolver(ShippingBoxFormSchema),
    defaultValues: getDefaults(ShippingBoxFormSchema),
  });


  const length = useWatch({ control: form.control, name: 'length' });
  const width = useWatch({ control: form.control, name: 'width' });
  const height = useWatch({ control: form.control, name: 'height' });
  const unit = useWatch({ control: form.control, name: 'unit' });

  useEffect(() => {
    if (!isOpen || !selectedItem) {
      return;
    }

    form.reset({
      length: selectedItem.length ?? 120,
      width: selectedItem.width ?? 80,
      height: selectedItem.height ?? 80,
      unit:
        (selectedItem.unit as 'cm' | 'in') ??
        (productSettingsData?.dimension_unit as 'cm' | 'in') ??
        'in',
      name: selectedItem.name ?? '',
      is_default: selectedItem.is_default ?? false,
    });
  }, [isOpen, selectedItem, productSettingsData, form]);

  const handleUnitChange = (newUnit: string) => {
    const nextUnit = newUnit as 'cm' | 'in';
    const values = form.getValues();
    const oldUnit = values.unit;

    form.setValue('length', convertValue(values.length, oldUnit, nextUnit) ?? 0);
    form.setValue('width', convertValue(values.width, oldUnit, nextUnit) ?? 0);
    form.setValue('height', convertValue(values.height, oldUnit, nextUnit) ?? 0);
    form.setValue('unit', nextUnit);
  };

  const handleOnclosePopup = () => {
    form.reset(getDefaults(ShippingBoxFormSchema));
    onClose();
  };

  const handleCreateOrUpdateBox = async (payload: ShippingBoxFormPayload) => {
    try {
      if (selectedItem) {
        const response = await updateBox({
          id: selectedItem?.id,
          data: payload,
        });
        onSave((response?.data as { id?: number })?.id);
      } else {
        const response = await createBox(payload);
        onSave((response?.data as { id?: number })?.id);
      }
      handleOnclosePopup();
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          handleOnclosePopup();
        }
      }}
    >
      <DialogContent cssOverride={styles.dialogContent}>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>
            {selectedItem
              ? __('Edit Shipping Box', 'kirki-ecommerce')
              : __('Create shipping box', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody cssOverride={styles.dialogBody}>
            <TextField
              name="name"
              label={__('Title', 'kirki-ecommerce')}
              placeholder={__('e.g. Small Package', 'kirki-ecommerce')}
            />
            <div>
              <Card
                cssOverride={mergeCss(
                  cardStyles.innerCard,
                  styles.dimensionsCard,
                )}
              >
                <CardContent cssOverride={cardStyles.innerContent}>
                  <span css={scoped(styles.dimensionsLabel)}>
                    <Text weight="medium">
                      {__('Dimensions', 'kirki-ecommerce')}
                    </Text>
                  </span>
                  <Flex
                    gap={2}
                    align="flex-end"
                    cssOverride={styles.dimensionsRow}
                  >
                    <NumberField
                      name="length"
                      label={__('Length', 'kirki-ecommerce')}
                      placeholder={__('e.g. 12', 'kirki-ecommerce')}
                      cssOverride={styles.dimensionField}
                    />
                    <NumberField
                      name="width"
                      label={__('Width', 'kirki-ecommerce')}
                      placeholder={__('e.g. 12', 'kirki-ecommerce')}
                      cssOverride={styles.dimensionField}
                    />
                    <NumberField
                      name="height"
                      label={__('Height', 'kirki-ecommerce')}
                      placeholder={__('e.g. 12', 'kirki-ecommerce')}
                      cssOverride={styles.dimensionField}
                    />
                    <SelectField
                      name="unit"
                      label={__('Unit', 'kirki-ecommerce')}
                      placeholder={__('e.g. cm', 'kirki-ecommerce')}
                      options={[
                        { value: 'cm', label: __('Centimeters (cm)', 'kirki-ecommerce') },
                        { value: 'in', label: __('Inches (in)', 'kirki-ecommerce') },
                      ]}
                      cssOverride={styles.dimensionField}
                      onValueChange={(value) => handleUnitChange(value ?? 'in')}
                    />
                  </Flex>
                </CardContent>
              </Card>
              <Card
                cssOverride={mergeCss(cardStyles.darkCard, styles.previewCard)}
              >
                <CardContent cssOverride={styles.previewContent}>
                  <ShippingBoxPreview
                    length={Number(length) || 0}
                    width={Number(width) || 0}
                    height={Number(height) || 0}
                    unit={unit ?? 'in'}
                  />
                </CardContent>
              </Card>
            </div>
          </DialogBody>
          <Separator cssOverride={styles.footerSeparator} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleOnclosePopup}
              disabled={isSubmitting}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleCreateOrUpdateBox)}
              loading={isSubmitting}
            >
              {selectedItem
                ? __('Update', 'kirki-ecommerce')
                : __('Add', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ShippingBoxPopup.displayName = 'ShippingBoxPopup';

export default ShippingBoxPopup;

const styles = defineStyles({
  dialogContent: {
    width: '632px',
  },
  dialogBody: {
    gap: theme.spacing[6],
  },
  dimensionsCard: {
    position: 'relative',
    overflow: 'visible',
    paddingTop: theme.spacing[5],
  },
  dimensionsLabel: {
    top: `-${theme.spacing[3]}`,
    left: '10%',
    transform: 'translateX(-50%)',
    position: 'absolute',
    padding: `${theme.spacing[0]} ${theme.spacing[2]}`,
    backgroundColor: theme.colors.background.surface,
  },
  dimensionsRow: {
    width: '100%',
    minWidth: 0,
  },
  dimensionField: {
    flex: '1 1 0',
    minWidth: 0,
    width: 0,
  },
  unitField: {
    flex: '0 0 auto',
    minWidth: 0,
    width: 'auto',
  },
  previewCard: {
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.md} ${theme.radius.md}`,
    marginTop: `-${theme.spacing[2]}`,
    height: '230px',
  },
  previewContent: {
    padding: theme.spacing[1],
    height: '100%',
  },
  footerSeparator: {
    margin: theme.spacing[0],
  },
});
