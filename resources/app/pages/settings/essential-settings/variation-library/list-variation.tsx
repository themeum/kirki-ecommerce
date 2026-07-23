import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BoxIcon } from '@/icons';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { useAttributeQuery } from '@/services/attribute';
import type { Attribute, AttributeValue, TaxonomyTableHeader } from '@/types';
import { theme } from '@/theme';
import { __, sprintf } from '@/wpi18n';

import VariationTable from '@/pages/settings/essential-settings/variation-library/variation-table/variation-table';
import VariationValuePopup from '@/pages/settings/essential-settings/variation-library/variation-value-dialog';

type AttributeWithMeta = Attribute & { updated_at?: string };

const ListVariation = () => {
  const { id } = useParams();
  const { data: selectedItem } = useAttributeQuery(Number(id), Boolean(id));

  const [attributeValueList, setAttributeValueList] = useState<AttributeValue[]>([]);
  const [addVariantPopup, setAddVariantPopup] = useState(false);
  const selectedAttribute = selectedItem as AttributeWithMeta | undefined;

  const tableHeaders: TaxonomyTableHeader[] = [
    { title: sprintf(__('%s', 'kirki-ecommerce'), selectedAttribute?.name ?? '') },
    { title: __('Updated', 'kirki-ecommerce') },
    { title: __('', 'kirki-ecommerce') },
  ];

  useEffect(() => {
    setAttributeValueList(selectedAttribute?.values ?? []);
  }, [selectedAttribute]);

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
            text={sprintf(__('%s', 'kirki-ecommerce'), selectedAttribute?.name ?? '')}
            rightAction={
              <div>
                <Button
                  variant="link"
                  style={{ color: theme.colors.text.emphasis, padding: 0 }}
                  onClick={() => setAddVariantPopup(true)}
                >
                  {__('Add value', 'kirki-ecommerce')}
                </Button>
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
                selectedItem={selectedAttribute}
              />
            </Card>
          )}
        </Flex>
      </Container>
      <VariationValuePopup
        isOpen={addVariantPopup}
        selectedItem={selectedAttribute}
        onClose={() => setAddVariantPopup(false)}
        type={selectedAttribute?.type}
      />
    </div>
  );
};

ListVariation.displayName = 'ListVariation';

export default ListVariation;
