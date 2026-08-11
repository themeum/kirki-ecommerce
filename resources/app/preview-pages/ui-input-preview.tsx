
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';

const UiInputPreview = () => {
  return (
    <Flex direction="column" gap={3} cssOverride={{ maxWidth: 320 }}>
      <Field>
        <FieldLabel htmlFor="ui-input-default">Default</FieldLabel>
        <Input id="ui-input-default" placeholder="Enter text" />
      </Field>
      <Field data-invalid>
        <FieldLabel htmlFor="ui-input-error">With error</FieldLabel>
        <Input
          id="ui-input-error"
          placeholder="Invalid value"
          error
          aria-invalid
        />
        <FieldError>Invalid value</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="ui-input-disabled">Disabled</FieldLabel>
        <Input id="ui-input-disabled" placeholder="Disabled" disabled />
      </Field>
    </Flex>
  );
};

UiInputPreview.displayName = 'UiInputPreview';

export default UiInputPreview;
