import ColorPicker from '@/components/color-picker';
import { theme } from '@/theme';

const ColorPickerPreview = () => {
  return (
    <div>
      <ColorPicker
        value={theme.colors.background.fillBrand}
        onChange={(value) => console.log(value)}
        label={'Set Color'}
      />
    </div>
  );
};

ColorPickerPreview.displayName = 'ColorPickerPreview';

export default ColorPickerPreview;
