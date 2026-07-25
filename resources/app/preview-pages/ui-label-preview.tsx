import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';

const UiLabelPreview = () => {
  return (
    <Flex direction="column" gap={4}>
      <Flex direction="column" gap={3}>
        <Label>Default label</Label>
        <Label data-disabled="true">Disabled label</Label>
        <Flex gap={2} align="center">
          <Input id="ui-label-input" placeholder="Associated input" />
          <Label htmlFor="ui-label-input">With htmlFor</Label>
        </Flex>
      </Flex>

      <Field>
        <FieldLabel htmlFor="ui-field-default">Field label</FieldLabel>
        <Input id="ui-field-default" placeholder="Enter value" />
        <FieldDescription>Helper text shown below the control.</FieldDescription>
      </Field>

      <Field data-invalid>
        <FieldLabel htmlFor="ui-field-error">Invalid field</FieldLabel>
        <Input
          id="ui-field-error"
          placeholder="Enter value"
          error
          aria-invalid
        />
        <FieldError>This field has an error.</FieldError>
      </Field>

      <Field orientation="horizontal">
        <Input id="ui-field-horizontal" placeholder="Horizontal" />
        <FieldLabel htmlFor="ui-field-horizontal">Horizontal field</FieldLabel>
      </Field>
    </Flex>
  );
};

UiLabelPreview.displayName = 'UiLabelPreview';

export default UiLabelPreview;
