import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ColorPaletteIcon } from '@/icons';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { useAttributeQuery } from '@/services/attribute';
import type { Attribute, AttributeValue, TaxonomyTableHeader } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __, sprintf } from '@/wpi18n';

import VariationTable from '@/pages/settings/essential-settings/variation-library/variation-table/variation-table';
import VariationValuePopup from '@/pages/settings/essential-settings/variation-library/variation-value-dialog';

type AttributeWithMeta = Attribute & { updated_at?: string };

const ColorVariation = () => {
  const { id } = useParams();
  const { data: selectedItem } = useAttributeQuery(Number(id), Boolean(id));

  const [colorList, setColorList] = useState<AttributeValue[]>([]);
  const [addVariantPopup, setAddVariantPopup] = useState(false);
  const selectedAttribute = selectedItem as AttributeWithMeta | undefined;
  const tableHeaders: TaxonomyTableHeader[] = [
    { title: sprintf(__('%s', 'kirki-ecommerce'), selectedAttribute?.name ?? '') },
    { title: __('Hex code', 'kirki-ecommerce') },
    { title: __('Updated', 'kirki-ecommerce') },
    { title: __('', 'kirki-ecommerce') },
  ];

  useEffect(() => {
    setColorList(selectedAttribute?.values ?? []);
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
            textIcon={<ColorPaletteIcon />}
            text={__('Color', 'kirki-ecommerce')}
            rightAction={
              <div>
                <Button
                  variant="link"
                  css={styles.addColorButton}
                  onClick={() => setAddVariantPopup(true)}
                >
                  {__('Add color', 'kirki-ecommerce')}
                </Button>
              </div>
            }
          />
          {!colorList?.length ? (
            <Card css={[cardStyles.largeCard, styles.roundedCard]}>
              <CardContent css={[cardStyles.largeContentPadded, styles.emptyContent]}>
                <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
                  <ColorPaletteIcon />
                  <span style={{ color: '#878593' }}>
                    {__('No color added yet', 'kirki-ecommerce')}
                  </span>
                </Flex>
              </CardContent>
            </Card>
          ) : (
            <Card css={cardStyles.tableCard}>
              <CardContent css={cardStyles.tableContent}>
                <VariationTable
                  results={colorList}
                  updateDataList={setColorList}
                  tableHeaders={tableHeaders}
                  selectedItem={selectedAttribute}
                />
              </CardContent>
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

ColorVariation.displayName = 'ColorVariation';

export default ColorVariation;

const styles = {
  addColorButton: scoped({
    color: theme.colors.text.emphasis,
    padding: theme.spacing[0],
  }),
  roundedCard: scoped({
    borderRadius: theme.radius.lg,
  }),
  emptyContent: scoped({
    padding: `${theme.spacing[9]} 0`,
  }),
};
