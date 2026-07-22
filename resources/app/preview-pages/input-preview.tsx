import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';

const InputPreview = () => {
  const handleValueChange = (value: string) => {
    console.log(value);
  };

  return (
    <>
      <Flex direction="column" gap={8}>
        <Label helpText="this field is for username">Username</Label>
        <Input
          placeholder="Placeholder"
          type="text"
          onChange={(event) => handleValueChange(event.target.value)}
          onBlur={(event) => handleValueChange(event.target.value)}
        />
      </Flex>
      <Flex direction="column" gap={8}>
        <Label>Description</Label>
        <Textarea
          placeholder="Write a description"
          onChange={(event) => handleValueChange(event.target.value)}
          onBlur={(event) => handleValueChange(event.target.value)}
          rows={5}
        />
      </Flex>
      <Flex direction="column" gap={8}>
        <Label error helpText="choos a file">
          Photo
        </Label>
        <Input
          type="file"
          accept=".jpeg"
          multiple
          error
          onChange={(event) => handleValueChange(event.target.value)}
        />
      </Flex>
    </>
  );
};

InputPreview.displayName = 'InputPreview';

export default InputPreview;
