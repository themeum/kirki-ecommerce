import Input from '@/molecules/input';

const InputPreview = () => {
  const handleValueChange = (value: string | number) => {
    console.log(value);
  };

  return (
    <>
      <Input
        label="Username"
        helpText="this field is for username"
        placeholder="Placeholder"
        type="text"
        onChange={handleValueChange}
        onBlur={handleValueChange}
      />
      <Input
        label="Description"
        placeholder="Write a description"
        onChange={handleValueChange}
        onBlur={handleValueChange}
        multiline={5}
      />
      <Input
        label="Photo"
        placeholder="Placeholder"
        helpText="choos a file"
        type="file"
        accept=".jpeg"
        multiple
        onChange={handleValueChange}
        onBlur={handleValueChange}
        error="There is an error"
      />
    </>
  );
};

InputPreview.displayName = 'InputPreview';

export default InputPreview;
