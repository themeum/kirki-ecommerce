import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';

type NotifyCustomerProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

const NotifyCustomer = ({ label, value, onChange }: NotifyCustomerProps) => {
  return (
    <Flex direction="column" gap={1} cssOverride={{ marginTop: theme.spacing[4] }}>
      <Checkbox label={label} value={value} onChange={onChange} />
    </Flex>
  );
};

NotifyCustomer.displayName = 'NotifyCustomer';

export default NotifyCustomer;
