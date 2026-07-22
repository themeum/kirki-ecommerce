import ToggleButton from '@/components/ui/toggle-button';

const ToggleButtonPreview = () => {
  const handleOnClick = (nextValue: boolean) => {
    console.log(nextValue);
  };

  return (
    <ToggleButton
      value={false}
      onChange={(nextValue) => {
        handleOnClick(nextValue);
      }}
      label="Toggle me"
    />
  );
};

ToggleButtonPreview.displayName = 'ToggleButtonPreview';

export default ToggleButtonPreview;
