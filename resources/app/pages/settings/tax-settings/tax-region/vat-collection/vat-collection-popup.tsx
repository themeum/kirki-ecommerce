import { useState, useEffect, type ReactNode } from 'react';

import Button from '@/molecules/button';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import { Select } from '@/molecules/select';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import type { TaxRate } from '../../utils';

type VatStateOption = SelectOption & {
  leftIcon?: ReactNode;
};

type VatItemForm = {
  state: string;
  rate: string | number;
  flag: string;
};

type VatCollectionPopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  statesOption: VatStateOption[];
  onAdd: (item: TaxRate, index?: number | null) => void;
  editIndex: number | null;
  setEditIndex: (index: number | null) => void;
  vatCollectionList: TaxRate[];
};

const VatCollectionPopup = (props: VatCollectionPopupProps) => {
  const {
    openPopup,
    setOpenPopup,
    statesOption,
    onAdd,
    editIndex,
    setEditIndex,
    vatCollectionList,
  } = props;

  const [vatItem, setVatItem] = useState<VatItemForm>({
    state: '',
    rate: '',
    flag: '',
  });

  useEffect(() => {
    if (typeof editIndex === 'number' && vatCollectionList?.[editIndex]) {
      const item = vatCollectionList[editIndex];

      setVatItem({
        state: String(item.state),
        rate: item.rate,
        flag: item.flag || '',
      });
    } else {
      setVatItem({ state: '', rate: '', flag: '' });
    }
  }, [editIndex, vatCollectionList, openPopup]);

  const handleOnChange = (value: string | number, key: keyof VatItemForm) => {
    setVatItem((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const buttonState = vatItem?.state === '' || vatItem?.rate === '';

  return (
    <Popover isOpen={openPopup} style={{ width: '400px' }}>
      <PopoverHeader
        style={{ padding: 'var(--decom-spacing-5)' }}
        onClose={() => {
          setOpenPopup(false);
          setEditIndex(null);
        }}
      >
        {__('Collect VAT', 'kirki-ecommerce')}
      </PopoverHeader>

      <PopoverBody
        style={{
          padding:
            'var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)',
          gap: 'var(--decom-spacing-4)',
        }}
      >
        <Select
          label={__('Select country', 'kirki-ecommerce')}
          optionsArray={statesOption}
          value={vatItem.state}
          onChange={(value) => {
            const nextValue = Array.isArray(value) ? value[0] : value;
            handleOnChange(nextValue ?? '', 'state');
          }}
        />

        <Input
          label={__('VAT (%)', 'kirki-ecommerce')}
          placeholder="e.g. 20%"
          value={vatItem.rate}
          onChange={(value: string | number) => handleOnChange(value, 'rate')}
        />
      </PopoverBody>
      <PopoverFooter>
        <Button
          type="outlined"
          text={__('Cancel', 'kirki-ecommerce')}
          size="small"
          onClick={() => {
            setOpenPopup(false);
            setEditIndex(null);
          }}
        />
        <Button
          type="primary"
          text={
            typeof editIndex === 'number'
              ? __('Update', 'kirki-ecommerce')
              : __('Done', 'kirki-ecommerce')
          }
          size="small"
          onClick={() => {
            onAdd(
              {
                state: vatItem.state,
                rate: vatItem.rate,
                flag: vatItem.flag,
              },
              editIndex,
            );
            setOpenPopup(false);
          }}
          state={buttonState ? 'disabled' : ''}
        />
      </PopoverFooter>
    </Popover>
  );
};

VatCollectionPopup.displayName = 'VatCollectionPopup';

export default VatCollectionPopup;
