import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';

const InputPreview = () => {
  const handleValueChange = (value: string) => {
    console.log(value);
  };

  return (
    <>
      <Field>
        <FieldLabel>Username</FieldLabel>
        <Input
          placeholder="Placeholder"
          type="text"
          onChange={(event) => handleValueChange(event.target.value)}
          onBlur={(event) => handleValueChange(event.target.value)}
        />
        <FieldDescription>this field is for username</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Description</FieldLabel>
        <Textarea
          placeholder="Write a description"
          onChange={(event) => handleValueChange(event.target.value)}
          onBlur={(event) => handleValueChange(event.target.value)}
          rows={5}
        />
      </Field>
      <Field data-invalid>
        <FieldLabel>Photo</FieldLabel>
        <Input
          type="file"
          accept=".jpeg"
          multiple
          error
          aria-invalid
          onChange={(event) => handleValueChange(event.target.value)}
        />
        <FieldError>choos a file</FieldError>
      </Field>
    </>
  );
};

InputPreview.displayName = 'InputPreview';

export default InputPreview;
