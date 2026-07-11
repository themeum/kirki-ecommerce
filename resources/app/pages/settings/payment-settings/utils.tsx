import type { ReactNode } from 'react';

import { EyeClosedIcon, EyeIcon } from '@/icons';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

type GatewayField = {
  name: string;
  label?: string;
  type?: string;
};

export const getFormField = (
  field: GatewayField,
  handleOnChange: (value: unknown, key: string) => void,
  index: string,
  handleRightAction: (key: string) => void,
  inputFieldType: string,
  gatewayConfObj: Record<string, unknown>,
  errors: FormErrors,
): ReactNode => {
  const inputValue = (gatewayConfObj?.[field?.name] as string) ?? '';
  const isSecret = field?.name.includes('secret');

  if (field?.type === 'text') {
    return (
      <Flex gap={8} style={{ alignItems: 'center' }}>
        <Input
          label={field?.label}
          onChange={(value) => handleOnChange(value, field?.name)}
          placeholder={__('Type here', 'kirki-ecommerce')}
          type={inputFieldType}
          rightIcon={
            isSecret ? (
              inputFieldType === 'password' ? (
                <EyeClosedIcon />
              ) : (
                <EyeIcon />
              )
            ) : undefined
          }
          handleRightAction={
            isSecret ? () => handleRightAction(index) : undefined
          }
          value={inputValue}
          error={errors[field?.name] as string | boolean | undefined}
        />
      </Flex>
    );
  }
};
