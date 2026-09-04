import { Trash2 } from 'lucide-react';
import { type Dispatch, type ReactNode, type SetStateAction, useState } from 'react';

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
import { isDefined } from '@/utils/object';
import { __, sprintf } from '@/wpi18n';

type VatCountryOption = SelectOption & {
  leftIcon?: ReactNode;
};

type VatCollectionProps = {
  memberCountries: TaxRegionState[];
  process: string;
  vatCollectionList: CountryTaxRate[];
  setVatCollectionList: Dispatch<SetStateAction<CountryTaxRate[]>>;
};

export const VatCollection = (props: VatCollectionProps) => {
  const { memberCountries, process, vatCollectionList, setVatCollectionList } = props;
  const [showVatCollectionPopup, setShowVatCollectionPopup] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const disableAddVatButton = process !== 'oss' && vatCollectionList?.length >= 1;

  const filteredCountryOptions: VatCountryOption[] = memberCountries
    .filter((country) => {
      const code = country.code ?? String(country.id);

      if (!isDefined(editIndex)) {
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
    const safePrev = Array.isArray(vatCollectionList) ? vatCollectionList : [];
    const updatedList =
      typeof index === 'number'
        ? safePrev.map((item, i) => (i === index ? newItem : item))
        : [...safePrev, newItem];

    setVatCollectionList(updatedList);
    setEditIndex(null);
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
  };

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
                <Card key={item.code ?? index} cssOverride={cardStyles.innerCard}>
                  <CardContent cssOverride={mergeCss(cardStyles.innerContent, styles.vatRow)}>
                    <Flex justify="space-between" cssOverride={{ width: '100%' }}>
                      <Flex gap={2} align="center">
                        {meta.flag}
                        <Text variant="small" weight="semibold">
                          {meta.name}
                        </Text>
                      </Flex>
                      <Text variant="small" cssOverride={styles.vatText} data-vat-text>
                        {sprintf('%s%%', item?.rate ?? 0)}
                      </Text>
                      <Flex gap={2} cssOverride={mergeCss(styles.vatActions)} data-vat-actions>
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
    height: '54px',
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    '&:hover [data-vat-actions]': {
      opacity: 1,
      visibility: 'visible',
      display: 'flex',
      pointerEvents: 'auto',
    },
    '&:hover [data-vat-text]': {
      opacity: 0,
      display: 'none',
    },
  },
  vatActions: {
    opacity: 0,
    visibility: 'hidden',
    display: 'none',
    pointerEvents: 'none',
    transition: 'all 0.2s ease',
  },
  vatText: {
    opacity: 1,
    display: 'block',
    transition: 'opacity 0.2s ease',
  },
});
