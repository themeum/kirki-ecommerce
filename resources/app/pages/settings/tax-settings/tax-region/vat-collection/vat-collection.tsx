import { useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { toast } from 'sonner';

import HeaderActionsCard from '@/components/header-actions-card';
import { TrashIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import { CLASS_PREFIX } from '@/conf';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import type { TaxRate, TaxRegion } from '@/pages/settings/tax-settings/utils';
import VatCollectionPopup from '@/pages/settings/tax-settings/tax-region/vat-collection/vat-collection-popup';

type VatStateOption = SelectOption & {
  leftIcon?: ReactNode;
};

type VatCollectionProps = {
  region?: TaxRegion;
  process: string;
  vatCollectionList: TaxRate[];
  setVatCollectionList: Dispatch<SetStateAction<TaxRate[]>>;
  updateVatCollection: (
    vatList: TaxRate[],
    from?: string,
  ) => void | Promise<void>;
};

export const VatCollection = (props: VatCollectionProps) => {
  const {
    region,
    process,
    vatCollectionList,
    setVatCollectionList,
    updateVatCollection,
  } = props;
  const [showVatCollectionPopup, setShowVatCollectionPopup] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const disableAddVatButton =
    process !== 'oss' && vatCollectionList?.length >= 1;

  const filteredStatesOption: VatStateOption[] = Array.isArray(region?.states)
    ? region.states
        .filter((state) => {
          if (editIndex === null || editIndex === undefined) {
            return !vatCollectionList.some((vat) => vat.state === state?.id);
          }

          return !vatCollectionList.some(
            (vat, index) => index !== editIndex && vat.state === state?.id,
          );
        })
        .map((state) => ({
          title: String(state?.id),
          value: state?.id,
          leftIcon: state?.flag,
        }))
    : [];

  const handleAddOrUpdateVAT = (newItem: TaxRate, index?: number | null) => {
    setVatCollectionList((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updatedList =
        typeof index === 'number'
          ? safePrev.map((item, i) => (i === index ? newItem : item))
          : [...safePrev, newItem];

      updateVatCollection(updatedList);
      setEditIndex(null);
      return updatedList;
    });

    setShowVatCollectionPopup(false);
  };

  const handleEditVatRate = (index: number) => {
    setEditIndex(index);
    setShowVatCollectionPopup(true);
  };

  const handleDeleteItem = (itemToDelete: TaxRate) => {
    const initialList = Array.isArray(vatCollectionList)
      ? [...vatCollectionList]
      : [];

    const updatedList = initialList.filter(
      (item) =>
        item.state !== itemToDelete.state || item.rate !== itemToDelete.rate,
    );
    setVatCollectionList(updatedList);
    toast(__('VAT collection deleted', 'kirki-ecommerce'), {
      duration: 5000,
      action: {
        label: __('Undo', 'kirki-ecommerce'),
        onClick: () => {
          setVatCollectionList(initialList);
        },
      },
      onAutoClose: () => {
        updateVatCollection(updatedList, 'delete');
      },
    });
  };

  const getFlagForState = (stateName: string | number) => {
    const country = region?.states.find((region) => region.id === stateName);
    return country?.flag || '';
  };

  return (
    <div>
      <Card type="large">
        <HeaderActionsCard
          header={__('VAT Collection', 'kirki-ecommerce')}
          subHeader={__(
            'Used to create shipping rates for different product groups, like heavy items needing higher fees.',
            'kirki-ecommerce',
          )}
          buttonText={__('Collect VAT', 'kirki-ecommerce')}
          hideButton={disableAddVatButton}
          onAdd={() => setShowVatCollectionPopup(true)}
        />
        <Flex direction="column" gap={8}>
          {vatCollectionList?.map((item, index) => (
            <Card
              type={'inner'}
              key={index}
              className={`${CLASS_PREFIX}-vat-row`}
            >
              <Text
                header={item?.state}
                leftIcon={getFlagForState(item?.state)}
              />
              <Text
                header={`${item?.rate}%`}
                className={`${CLASS_PREFIX}-vat-text`}
              />
              <Flex gap={8} className={`${CLASS_PREFIX}-vat-actions`}>
                <Button
                  type={'tartiary'}
                  text={__('Edit Rates', 'kirki-ecommerce')}
                  onClick={() => handleEditVatRate(index)}
                />
                <Button
                  type={'secondary'}
                  size={'icon'}
                  icon={<TrashIcon />}
                  onClick={() => handleDeleteItem(item)}
                />
              </Flex>
            </Card>
          ))}
        </Flex>
      </Card>
      {showVatCollectionPopup && (
        <VatCollectionPopup
          statesOption={filteredStatesOption}
          openPopup={showVatCollectionPopup}
          setOpenPopup={setShowVatCollectionPopup}
          onAdd={handleAddOrUpdateVAT}
          editIndex={editIndex}
          setEditIndex={setEditIndex}
          vatCollectionList={vatCollectionList}
        />
      )}
    </div>
  );
};

VatCollection.displayName = 'VatCollection';
