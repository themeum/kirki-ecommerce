import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import CheckboxField from '@/components/form/checkbox-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { CustomerFormInput } from '@/features/customers/schemas/forms/customer-form';
import { useCheckCustomerEmail } from '@/features/customers/services/customer';
import { FileTextIcon } from '@/icons';
import { __ } from '@/wpi18n';

type CustomerBasicInfoProps = {
  isNew?: boolean;
  hasWordpressUser?: boolean;
  customerId?: number;
};

const CustomerBasicInfo = ({
  isNew = true,
  hasWordpressUser = false,
  customerId,
}: CustomerBasicInfoProps) => {
  const { getValues, setError, clearErrors } = useFormContext<CustomerFormInput>();
  const checkEmail = useCheckCustomerEmail();
  const lastCheckedEmailRef = useRef('');

  const handleEmailBlur = async () => {
    if (!isNew && hasWordpressUser) {
      return;
    }

    const email = getValues('email')?.trim() ?? '';

    if (!email || !z.string().email().safeParse(email).success) {
      return;
    }

    if (email === lastCheckedEmailRef.current) {
      return;
    }

    lastCheckedEmailRef.current = email;

    try {
      const result = await checkEmail(email, isNew ? undefined : customerId);

      if ((getValues('email')?.trim() ?? '') !== email) {
        return;
      }

      if (result.data) {
        clearErrors('email');
      } else {
        setError('email', { type: 'manual', message: result.message });
      }
    } catch {
      lastCheckedEmailRef.current = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <Flex gap={2} align="center">
          <FileTextIcon />
          <Text weight="semibold">{__('Basic info', 'kirki-ecommerce')}</Text>
        </Flex>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={4}>
          <TextField
            name="first_name"
            label={__('First Name', 'kirki-ecommerce')}
            placeholder={__('e.g. John', 'kirki-ecommerce')}
          />
          <TextField
            name="last_name"
            label={__('Last Name', 'kirki-ecommerce')}
            placeholder={__('e.g. Musk', 'kirki-ecommerce')}
          />
          <TextField
            name="email"
            label={__('Email', 'kirki-ecommerce')}
            type="email"
            placeholder={__('example@yourmail.com', 'kirki-ecommerce')}
            disabled={!isNew && hasWordpressUser}
            onBlur={() => void handleEmailBlur()}
          />
          <TextField
            name="phone"
            label={__('Phone Number', 'kirki-ecommerce')}
            type="tel"
            placeholder={__('+1 (555) 222 4354', 'kirki-ecommerce')}
          />
          {/* Hidden per design for now - accepts_marketing still defaults to false, to be surfaced later */}
          {isNew && (
            <CheckboxField
              name="create_wordpress_user"
              label={__('Create WordPress user', 'kirki-ecommerce')}
            />
          )}
        </Flex>
      </CardContent>
    </Card>
  );
};

CustomerBasicInfo.displayName = 'CustomerBasicInfo';

export default CustomerBasicInfo;
