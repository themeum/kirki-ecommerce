import PasswordField from '@/components/form/password-field';
import SelectField from '@/components/form/select-field';
import SwitchField from '@/components/form/switch-field';
import TextField from '@/components/form/text-field';
import Flex from '@/components/ui/flex';
import type { OnlinePaymentFields } from '@/features/settings/payment/schemas/catalog/payment';

type OnlinePaymentField = {
  name: string;
  label?: string;
  type?: 'text' | 'password' | 'checkbox' | 'select';
  required?: boolean;
  description?: string;
  placeholder?: string;
  default?: unknown;
  options?: {
    label: string;
    value: string;
  }[];
};

type DynamicOnlinePaymentFieldsProps = {
  fields?: OnlinePaymentFields;
};

function renderField(field: OnlinePaymentField) {
  switch (field.type) {
    case 'text':
      return <TextField
        name={field.name}
        label={field.label}
        placeholder={field.placeholder}
        infoText={field.description}
      />
    case 'password':
      return <PasswordField
        name={field.name}
        label={field.label}
        placeholder={field.placeholder}
        infoText={field.description}
      />;
    case 'select':
      return <SelectField
        name={field.name}
        label={field.label}
        options={field.options ?? []}
        infoText={field.description}
      />
    case 'checkbox':
      return <SwitchField
        name={field.name}
        label={field.label}
        infoText={field.description}
      />
    default:
      return null;
  }
}

export const DynamicOnlinePaymentFields = ({
  fields = [],
}: DynamicOnlinePaymentFieldsProps) => {
  return (
    <Flex direction="column" gap={2}>
      {fields.map((field) => {
        return renderField(field as OnlinePaymentField);
      })}
    </Flex>
  );
};
