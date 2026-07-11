import ToggleButton from '@/molecules/toggle-button';

const ToggleButtonPreview = () => {
  const handleOnClick = (nextValue: boolean) => {
    console.log(nextValue);
  };

  return (
    <ToggleButton
      value={'false' as unknown as boolean}
      onChange={(nextValue) => {
        handleOnClick(nextValue);
      }}
      label="Toggle me"
    />
  );
};

ToggleButtonPreview.displayName = 'ToggleButtonPreview';

export default ToggleButtonPreview;
