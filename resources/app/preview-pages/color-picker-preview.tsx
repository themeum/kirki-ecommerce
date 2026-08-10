import { useState } from 'react';

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
  ColorPickerValue,
} from '@/components/ui/color-picker';
import { Field, FieldLabel } from '@/components/ui/field';

const ColorPickerPreview = () => {
  const [color, setColor] = useState('');

  return (
    <Field cssOverride={{ maxWidth: '280px' }}>
      <FieldLabel htmlFor="color-picker-preview">{'Set Color'}</FieldLabel>
      <ColorPicker value={color} onValueChange={setColor}>
        <ColorPickerTrigger id="color-picker-preview">
          <ColorPickerSwatch />
          <ColorPickerValue placeholder="#007ba7" />
        </ColorPickerTrigger>
        <ColorPickerContent>
          <ColorPickerArea />
          <ColorPickerInput placeholder="#007ba7" />
        </ColorPickerContent>
      </ColorPicker>
    </Field>
  );
};

ColorPickerPreview.displayName = 'ColorPickerPreview';

export default ColorPickerPreview;
