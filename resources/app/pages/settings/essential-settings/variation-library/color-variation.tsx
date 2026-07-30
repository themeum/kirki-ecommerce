import type { CSSObject } from '@emotion/react';
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
import { scoped, mergeCss } from '@/theme/mixins';
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
        <Flex direction="column" gap={4}>
          <PageNavbar
            textIcon={<ColorPaletteIcon />}
            text={__('Color', 'kirki-ecommerce')}
            rightAction={
              <div>
                <Button
                  variant="link"
                  cssOverride={styles.addColorButton}
                  onClick={() => setAddVariantPopup(true)}
                >
                  {__('Add color', 'kirki-ecommerce')}
                </Button>
              </div>
            }
          />
          {!colorList?.length ? (
            <Card cssOverride={mergeCss(cardStyles.largeCard, styles.roundedCard)}>
              <CardContent cssOverride={mergeCss(cardStyles.largeContentPadded, styles.emptyContent)}>
                <Flex direction="column" gap={2} align="center">
                  <ColorPaletteIcon />
                  <span css={scoped(styles.mutedText)}>
                    {__('No color added yet', 'kirki-ecommerce')}
                  </span>
                </Flex>
              </CardContent>
            </Card>
          ) : (
            <Card cssOverride={cardStyles.tableCard}>
              <CardContent cssOverride={cardStyles.tableContent}>
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
  addColorButton: ({
    color: theme.colors.text.emphasis,
    padding: theme.spacing[0],
  } satisfies CSSObject),
  roundedCard: ({
    borderRadius: theme.radius.lg,
  } satisfies CSSObject),
  emptyContent: ({
    padding: `${theme.spacing[9]} 0`,
  } satisfies CSSObject),
  mutedText: ({
    color: theme.colors.text.subdued,
  } satisfies CSSObject),
};
