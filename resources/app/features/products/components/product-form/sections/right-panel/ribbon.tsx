import { useFormContext } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import CollapsibleField from '@/components/ui/collapsible-field';
import { RIBBON_COLOR_PALETTE } from '@/features/products/schemas/forms/product-basics-form';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { __ } from '@/wpi18n';

import { RibbonColorSwatches, RibbonPreviewBadge } from './ribbon-swatches';

const Ribbon = () => {
  const { watch, setValue } = useFormContext<ProductFormInput>();
  const ribbon = watch('ribbon');
  const ribbonColor = watch('ribbon_color') || RIBBON_COLOR_PALETTE[0];

  return (
    <CollapsibleField
      addLabel={__('Ribbon', 'kirki-ecommerce')}
      removeLabel={__('Remove ribbon', 'kirki-ecommerce')}
      label={__('Ribbon', 'kirki-ecommerce')}
      labelFor="ribbon"
      hasValue={Boolean(ribbon)}
      onRemove={() => {
        setValue('ribbon', '', { shouldDirty: true, shouldValidate: true });
        setValue('ribbon_color', null, { shouldDirty: true, shouldValidate: true });
      }}
    >
      <TextField name="ribbon" placeholder={__('e.g. Fresh Arrival', 'kirki-ecommerce')} />
      <RibbonPreviewBadge text={ribbon ?? ''} color={ribbonColor} />
      <RibbonColorSwatches
        value={ribbonColor}
        onChange={(color) =>
          setValue('ribbon_color', color, { shouldDirty: true, shouldValidate: true })
        }
      />
    </CollapsibleField>
  );
};

Ribbon.displayName = 'Ribbon';

export default Ribbon;
