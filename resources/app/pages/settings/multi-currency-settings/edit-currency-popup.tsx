import { type Dispatch, type SetStateAction } from 'react';

import { CLASS_PREFIX } from '@/conf';
import { InfoIcon } from '@/icons';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Label from '@/molecules/label';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import Text from '@/molecules/text';
import type { Currency } from '@/types';
import { __, sprintf } from '@/wpi18n';

type EditCurrencyItem = Currency & {
  icon?: string;
};

type EditCurrencyPopupProps = {
  editCurrency: EditCurrencyItem;
  setEditCurrency: Dispatch<SetStateAction<EditCurrencyItem | null>>;
  handleUpdateData: (currency: Currency) => void;
};

const EditCurrencyPopup = ({
  editCurrency,
  setEditCurrency,
  handleUpdateData,
}: EditCurrencyPopupProps) => {
  const handleClosePopup = () => {
    setEditCurrency(null);
  };
  return (
    <div>
      <Popover isOpen={editCurrency ? true : false} style={{ width: '442px' }}>
        <PopoverHeader borderBottom onClose={() => handleClosePopup()}>
          {__('Update Exchange Rates', 'kirki-ecommerce')}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding: 'var(--decom-spacing-5)',
            gap: 'var(--decom-spacing-4)',
          }}
        >
          <Label
            className={`${CLASS_PREFIX}-edit-currency-rate-popup-label`}
            text={__('Enter rates per 1 USD', 'kirki-ecommerce')}
            leftIcon={<InfoIcon />}
          />
          <Flex
            direction="column"
            gap={12}
            style={{
              maxHeight: '200px',
              overflowX: 'scroll',
            }}
          >
            <Flex style={{ justifyContent: 'space-between' }}>
              <Flex gap={12}>
                <Text
                  type="primary"
                  header={sprintf(__('%s', 'kirki-ecommerce'), editCurrency?.icon ?? '')}
                />
                <Text
                  type="secondary"
                  header={sprintf(__('%s', 'kirki-ecommerce'), editCurrency?.code ?? '')}
                />
                <Text
                  type="xsm"
                  header={sprintf(__('%s', 'kirki-ecommerce'), editCurrency?.name ?? '')}
                />
              </Flex>
              <div style={{ width: 'auto', margin: 'var(--decom-spacing-f1)' }}>
                <Input
                  placeholder={__('0.730', 'kirki-ecommerce')}
                  style={{ width: 'auto' }}
                  value={String(editCurrency?.exchange_rate ?? '')}
                  onChange={(value) =>
                    setEditCurrency({ ...editCurrency, exchange_rate: value })
                  }
                />
              </div>
            </Flex>
          </Flex>
        </PopoverBody>
        <PopoverFooter>
          <Button
            text={__('Cancel', 'kirki-ecommerce')}
            size="small"
            type={'outlined'}
            onClick={() => {
              setEditCurrency(null);
            }}
          />
          <Button
            text={__('Update', 'kirki-ecommerce')}
            size="small"
            type={'primary'}
            onClick={() => {
              handleUpdateData(editCurrency);
              setEditCurrency(null);
            }}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};

EditCurrencyPopup.displayName = 'EditCurrencyPopup';

export default EditCurrencyPopup;
