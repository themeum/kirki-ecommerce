import { useEffect } from 'react';

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from '@/components/ui/color-picker';
import { useMultiSelectChipLayer } from '@/components/ui/multi-select-chip-layer';
import type { AttributeValueOption } from '@/features/products/components/attribute-value-types';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type EditableSwatchProps = {
  option: AttributeValueOption;
  onColorChange: (color: string) => void;
};

/**
 * A value's swatch and title inside its chip, where the swatch opens a color
 * picker. While the picker is open it tells the surrounding `MultiSelect`, so
 * picking a color or dismissing the picker never opens the value popover.
 *
 * @param props Component props.
 *
 * @returns EditableSwatch element.
 * @since 1.0.0
 */
const EditableSwatch = ({ option, onColorChange }: EditableSwatchProps) => {
  const reportChipLayer = useMultiSelectChipLayer();

  useEffect(() => () => reportChipLayer(false), [reportChipLayer]);

  return (
    <span css={scoped(styles.swatchLabel)}>
      <ColorPicker
        value={option.color ?? ''}
        onValueChange={(next) => next && onColorChange(next)}
        onOpenChange={reportChipLayer}
      >
        <ColorPickerTrigger
          aria-label={sprintf(__('Change the colour of %s', 'kirki-ecommerce'), option.title)}
          cssOverride={styles.swatchTrigger}
        >
          <ColorPickerSwatch />
        </ColorPickerTrigger>
        <ColorPickerContent>
          <ColorPickerArea />
          <ColorPickerInput placeholder={__('#000000', 'kirki-ecommerce')} />
        </ColorPickerContent>
      </ColorPicker>
      {option.title}
    </span>
  );
};

EditableSwatch.displayName = 'EditableSwatch';

export default EditableSwatch;

const styles = defineStyles({
  swatchLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    verticalAlign: 'middle',
  },
  swatchTrigger: {
    width: 'auto',
    minHeight: 0,
    padding: 0,
    border: 'none',
    borderRadius: theme.radius.full,
    backgroundColor: 'transparent',
  },
});
