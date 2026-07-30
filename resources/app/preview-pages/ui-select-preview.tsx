
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const UiSelectPreview = () => {
  return (
    <Flex direction="column" gap={3} cssOverride={{ maxWidth: 240 }}>
      <Field>
        <FieldLabel>Default</FieldLabel>
        <Select defaultValue="apple">
          <SelectTrigger>
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field data-invalid>
        <FieldLabel>With error</FieldLabel>
        <Select>
          <SelectTrigger error aria-invalid>
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectContent>
        </Select>
        <FieldError>Selection required</FieldError>
      </Field>
    </Flex>
  );
};

UiSelectPreview.displayName = 'UiSelectPreview';

export default UiSelectPreview;
