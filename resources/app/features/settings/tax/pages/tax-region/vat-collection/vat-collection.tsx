import { css } from '@emotion/react';
import { Trash2 } from 'lucide-react';
import { type Dispatch, type ReactNode, type SetStateAction, useState } from 'react';
import { toast } from 'sonner';

import HeaderActionsCard from '@/components/header-actions-card';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { CountryTaxRate, TaxRegionState } from '@/features/settings/tax/lib/utils';
import VatCollectionPopup from '@/features/settings/tax/pages/tax-region/vat-collection/vat-collection-dialog';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import type { SelectOption } from '@/types/components/common';
import { __, sprintf } from '@/wpi18n';

type VatCountryOption = SelectOption & {
  leftIcon?: ReactNode;
};

type VatCollectionProps = {
  memberCountries: TaxRegionState[];
  process: string;
  vatCollectionList: CountryTaxRate[];
  setVatCollectionList: Dispatch<SetStateAction<CountryTaxRate[]>>;
  updateVatCollection: (vatList: CountryTaxRate[], from?: string) => void | Promise<void>;
};

export const VatCollection = (props: VatCollectionProps) => {
  const { memberCountries, process, vatCollectionList, setVatCollectionList, updateVatCollection } =
    props;
  const [showVatCollectionPopup, setShowVatCollectionPopup] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const disableAddVatButton = process !== 'oss' && vatCollectionList?.length >= 1;

  const filteredCountryOptions: VatCountryOption[] = memberCountries
    .filter((country) => {
      const code = country.code ?? String(country.id);

      if (editIndex === null || editIndex === undefined) {
        return !vatCollectionList.some((vat) => vat.code === code);
      }

      return !vatCollectionList.some((vat, index) => index !== editIndex && vat.code === code);
    })
    .map((country) => ({
      title: country.name ?? country.code ?? String(country.id),
      value: country.code ?? String(country.id),
      leftIcon: country.flag,
    }));

  const handleAddOrUpdateVAT = (newItem: CountryTaxRate, index?: number | null) => {
    setVatCollectionList((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updatedList =
        typeof index === 'number'
          ? safePrev.map((item, i) => (i === index ? newItem : item))
          : [...safePrev, newItem];

      void updateVatCollection(updatedList);
      setEditIndex(null);
      return updatedList;
    });

    setShowVatCollectionPopup(false);
  };

  const handleEditVatRate = (index: number) => {
    setEditIndex(index);
    setShowVatCollectionPopup(true);
  };

  const handleDeleteItem = (itemToDelete: CountryTaxRate) => {
    const initialList = Array.isArray(vatCollectionList) ? [...vatCollectionList] : [];

    const updatedList = initialList.filter((item) => item.code !== itemToDelete.code);
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
        void updateVatCollection(updatedList, 'delete');
      },
    });
  };

  /**
   * The persisted copy is a fallback only — the country dataset is refreshed
   * from whenever the code is known.
   */
  const resolveCountryMeta = (item: CountryTaxRate) => {
    const member = memberCountries.find((country) => country.code === item.code);
    return {
      name: member?.name ?? item.name ?? item.code,
      flag: member?.flag ?? item.flag ?? '',
    };
  };

  return (
    <div>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent>
          <HeaderActionsCard
            header={__('VAT Collection', 'kirki-ecommerce')}
            subHeader={__('Set VAT rates by country for sales to EU customers.', 'kirki-ecommerce')}
            buttonText={__('Collect VAT', 'kirki-ecommerce')}
            hideButton={disableAddVatButton}
            onAdd={() => setShowVatCollectionPopup(true)}
          />
          <Flex direction="column" gap={2} cssOverride={{ marginTop: theme.spacing[5] }}>
            {vatCollectionList?.map((item, index) => {
              const meta = resolveCountryMeta(item);

              return (
                <Card key={item.code ?? index} cssOverride={mergeCss(cardStyles.innerCard)}>
                  <CardContent cssOverride={{ ...cardStyles.innerContent, width: '100%' }}>
                    <Flex justify="space-between">
                      <Flex gap={2} align="center">
                        <Flex gap={2} align="center">
                          {meta.flag}
                          <Text>{meta.name}</Text>
                        </Flex>
                        <Text cssOverride={mergeCss(styles.vatText)}>
                          {sprintf(
                            /* translators: %s: VAT rate */
                            __('%s%% VAT', 'kirki-ecommerce'),
                            item?.rate ?? 0,
                          )}
                        </Text>
                      </Flex>
                      <Flex gap={2} cssOverride={mergeCss(styles.vatActions)}>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <Trash2 />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleEditVatRate(index)}
                          size="sm"
                        >
                          {__('Edit Rates', 'kirki-ecommerce')}
                        </Button>
                      </Flex>
                    </Flex>
                  </CardContent>
                </Card>
              );
            })}
          </Flex>
        </CardContent>
      </Card>
      {showVatCollectionPopup && (
        <VatCollectionPopup
          countryOptions={filteredCountryOptions}
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

const styles = defineStyles({
  vatRow: {
    height: '56px',
    maxHeight: '56px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing[3],
  },
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
  vatText: {
    opacity: 1,
    display: 'block',
    transition: 'opacity 0.2s ease',
  },
  vatTextHidden: css({
    opacity: 0,
    display: 'none',
  }),
});
