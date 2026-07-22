import ColorPicker from '@/components/color-picker';

const ColorPickerPreview = () => {
  return (
    <div>
      <ColorPicker
        value={'#1a6cbe'}
        onChange={(value) => console.log(value)}
        label={'Set Color'}
      />
    </div>
  );
};

ColorPickerPreview.displayName = 'ColorPickerPreview';

export default ColorPickerPreview;
