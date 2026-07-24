import { css } from '@emotion/react';
import { useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { toast } from 'sonner';

import HeaderActionsCard from '@/components/header-actions-card';
import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { TrashIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { SelectOption } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import type { TaxRate, TaxRegion } from '@/pages/settings/tax-settings/utils';
import VatCollectionPopup from '@/pages/settings/tax-settings/tax-region/vat-collection/vat-collection-dialog';

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
      <Card css={cardStyles.largeCard}>
        <CardContent css={cardStyles.largeContentPadded}>
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
                key={index}
                css={[cardStyles.innerCard, styles.vatRow]}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <CardContent css={cardStyles.innerContent}>
                  <Text
                    header={item?.state}
                    leftIcon={getFlagForState(item?.state)}
                  />
                  <Text
                    header={`${item?.rate}%`}
                    css={css(
                      styles.vatText,
                      hoveredIndex === index && styles.vatTextHidden,
                    )}
                  />
                  <Flex
                    gap={8}
                    css={css(
                      styles.vatActions,
                      hoveredIndex === index && styles.vatActionsActive,
                    )}
                  >
                    <Button
                      variant="secondary"
                      onClick={() => handleEditVatRate(index)}
                    >
                      {__('Edit Rates', 'kirki-ecommerce')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleDeleteItem(item)}
                    >
                      <TrashIcon />
                    </Button>
                  </Flex>
                </CardContent>
              </Card>
            ))}
          </Flex>
        </CardContent>
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

const styles = {
  vatRow: scoped({
    height: '56px',
    maxHeight: '56px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing[3],
  }),
  vatActions: css({
    opacity: 0,
    visibility: 'hidden',
    display: 'none',
    pointerEvents: 'none',
    transition: 'all 0.2s ease',
  }),
  vatActionsActive: css({
    opacity: 1,
    display: 'flex',
    visibility: 'visible',
    pointerEvents: 'auto',
  }),
  vatText: scoped({
    opacity: 1,
    display: 'block',
    transition: 'opacity 0.2s ease',
  }),
  vatTextHidden: css({
    opacity: 0,
    display: 'none',
  })
};
