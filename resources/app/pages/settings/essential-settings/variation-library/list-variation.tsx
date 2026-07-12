import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import { BoxIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { useAppSelector } from '@/store/hooks';
import type { Attribute, AttributeValue, TaxonomyTableHeader } from '@/types';
import { __, sprintf } from '@/wpi18n';

import VariationTable from '@/pages/settings/essential-settings/variation-library/variation-table/variation-table';
import VariationValuePopup from '@/pages/settings/essential-settings/variation-library/variation-value-popup';

type AttributeWithMeta = Attribute & { updated_at?: string };

const ListVariation = () => {
  const { id } = useParams();
  const attributeList = useAppSelector((state) => state.attributes?.data) || [];

  const [attributeValueList, setAttributeValueList] = useState<AttributeValue[]>([]);
  const [addVariantPopup, setAddVariantPopup] = useState(false);
  const selectedItem = attributeList.find(
    (attribute) => attribute?.id === Number(id),
  ) as AttributeWithMeta | undefined;

  const tableHeaders: TaxonomyTableHeader[] = [
    { title: sprintf(__('%s', 'kirki-ecommerce'), selectedItem?.name ?? '') },
    { title: __('Updated', 'kirki-ecommerce') },
    { title: __('', 'kirki-ecommerce') },
  ];

  useEffect(() => {
    setAttributeValueList(selectedItem?.values ?? []);
  }, [attributeList, selectedItem]);

  return (
    <div>
      <PageHeading
        text={__('Settings', 'kirki-ecommerce')}
        size="sm"
        sticky
        type="primary"
        style={{ height: '32px' }}
      />
      <Container size="sm">
        <Flex direction="column" gap={16}>
          <PageNavbar
            textIcon={<BoxIcon />}
            text={sprintf(__('%s', 'kirki-ecommerce'), selectedItem?.name ?? '')}
            rightAction={
              <div>
                <Button
                  type="link"
                  text={__('Add value', 'kirki-ecommerce')}
                  style={{ color: 'var(--decom-color-blue-3)', padding: 0 }}
                  onClick={() => setAddVariantPopup(true)}
                />
              </div>
            }
          />
          {!attributeValueList?.length ? (
            <Card
              type="large"
              style={{ borderRadius: '8px', padding: '36px 0' }}
            >
              <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
                <BoxIcon />
                <span style={{ color: '#878593' }}>
                  {__('No value added yet', 'kirki-ecommerce')}
                </span>
              </Flex>
            </Card>
          ) : (
            <Card type="table">
              <VariationTable
                tableHeaders={tableHeaders}
                results={attributeValueList}
                updateDataList={setAttributeValueList}
                selectedItem={selectedItem}
              />
            </Card>
          )}
        </Flex>
      </Container>
      <VariationValuePopup
        isOpen={addVariantPopup}
        selectedItem={selectedItem}
        onClose={() => setAddVariantPopup(false)}
        type={selectedItem?.type}
      />
    </div>
  );
};

export default ListVariation;
