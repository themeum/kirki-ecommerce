import type { CSSObject } from '@emotion/react';
import { type ReactElement, useState } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { useShippingBoxesQuery } from '@/services/shipping';
import { theme } from '@/theme';
;
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import ShippingBoxPopup from '@/pages/settings/shipping-settings/shipping-box/shipping-box-dialog';

type ShippingBoxProps = {
  value?: number | string | null;
  errors?: FormErrors;
  onChange?: (id: unknown, fieldName: string) => void;
  invisible?: boolean;
};

const ShippingBoxSelect = ({
  value,
  errors,
  onChange = () => {},
  invisible,
}: ShippingBoxProps) => {
  const navigate = useNavigate();
  const { data: shippingBoxes } = useShippingBoxesQuery({ limit: -1 });
  const [openShippingBoxPopup, setOpenShippingBoxPopup] = useState(false);

  const shippingBoxList = (shippingBoxes ?? []).map((item) => ({
    value: item.id,
    title: `${item.name} - ${item.length} x ${item.width} x ${item.height} ${item.unit}`,
  }));

  const handleOnChange = (id: unknown) => {
    onChange(id, 'shipping_box_id');
  };

  const ShippingBoxPopupView = ShippingBoxPopup as (props: {
    isOpen: boolean;
    onSave: (value: unknown) => void;
    onClose: () => void;
  }) => ReactElement;

  return (
    <>
      <Select
        value={value !== null && value !== undefined ? String(value) : ''}
        onValueChange={(next) => handleOnChange(next)}
      >
        <SelectTrigger
          error={Boolean(errors?.shipping_box_id)}
          style={{ visibility: invisible ? 'hidden' : 'visible' }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <Flex cssOverride={styles.header}>
            <Text color="secondary">{__('Available shipping boxes', 'kirki-ecommerce')}</Text>
            <Button
              variant="ghost"
              cssOverride={styles.manageButton}
              onClick={() => navigate('/settings/shipping')}
            >
              {__('Manage', 'kirki-ecommerce')}
            </Button>
          </Flex>
          <SelectSeparator />
          {shippingBoxList.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.title}
            </SelectItem>
          ))}
          <SelectSeparator />
          <ActionGroup cssOverride={styles.footer}>
            <Button
              variant="secondary"
              onClick={() => setOpenShippingBoxPopup(true)}
            >
              <PlusIcon />
              {__('Add new shipping box', 'kirki-ecommerce')}
            </Button>
          </ActionGroup>
        </SelectContent>
      </Select>
      {openShippingBoxPopup && (
        <ShippingBoxPopupView
          isOpen={openShippingBoxPopup}
          onSave={(saveValue) => handleOnChange(saveValue)}
          onClose={() => setOpenShippingBoxPopup(false)}
        />
      )}
    </>
  );
};

ShippingBoxSelect.displayName = 'ShippingBox';

export default ShippingBoxSelect;

const styles = {
  header: ({
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
  } satisfies CSSObject),
  footer: ({
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
  } satisfies CSSObject),
  manageButton: ({
    color: theme.colors.background.fillBrand,
  } satisfies CSSObject),
};
