import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { RouteConfig } from '@/config/route-config';
import type { Attribute, AttributeValue } from '@/features/products';
import { useAttributeQuery } from '@/features/products';
import VariationTable from '@/features/settings/essentials/pages/variation-library/variation-table/variation-table';
import VariationValuePopover from '@/features/settings/essentials/pages/variation-library/variation-value-popover';
import VariationDetailSkeleton from '@/features/settings/essentials/skeletons/variation-detail-skeleton';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { ColorPaletteIcon, SnowflakeIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type AttributeWithMeta = Attribute & { updated_at?: string };

const ColorVariation = () => {
  const { id } = useParams();
  const { data: selectedItem, isLoading } = useAttributeQuery(Number(id), Boolean(id));

  const [colorList, setColorList] = useState<AttributeValue[]>([]);
  const [addVariantPopup, setAddVariantPopup] = useState(false);
  const selectedAttribute = selectedItem as AttributeWithMeta | undefined;

  useEffect(() => {
    setColorList(selectedAttribute?.values ?? []);
  }, [selectedAttribute]);

  return (
    <>
      {!isLoading ? (
        <Container size="sm">
          <Flex direction="column" gap={4}>
            <SettingsPageHeader
              icon={<SnowflakeIcon />}
              title={selectedItem?.name ?? __('Color', 'kirki-ecommerce')}
              breadcrumbs={[
                {
                  label: __('Essentials', 'kirki-ecommerce'),
                  to: RouteConfig.Settings.get('EssentialsSettings').buildLink(),
                },
              ]}
              actions={
                <VariationValuePopover
                  isOpen={addVariantPopup}
                  onOpenChange={setAddVariantPopup}
                  selectedItem={selectedAttribute}
                  type={selectedAttribute?.type}
                >
                  <Button variant="tertiary" size="sm">
                    {__('Add color', 'kirki-ecommerce')}
                  </Button>
                </VariationValuePopover>
              }
            />
            {!colorList?.length ? (
              <Card data-search-skip="true" cssOverride={mergeCss(cardStyles.formCard, styles.roundedCard)}>
                <CardContent
                  cssOverride={mergeCss(cardStyles.largeContentPadded, styles.emptyContent)}
                >
                  <Flex direction="column" gap={2} align="center">
                    <ColorPaletteIcon />
                    <span css={scoped(styles.mutedText)}>
                      {__('No color added yet', 'kirki-ecommerce')}
                    </span>
                  </Flex>
                </CardContent>
              </Card>
            ) : (
              <VariationTable
                results={colorList}
                updateDataList={setColorList}
                selectedItem={selectedAttribute}
              />
            )}
          </Flex>
        </Container>
      ) : (
        <VariationDetailSkeleton title={__('Color', 'kirki-ecommerce')} />
      )}
    </>
  );
};

ColorVariation.displayName = 'ColorVariation';

export default ColorVariation;

const styles = defineStyles({
  roundedCard: {
    borderRadius: theme.radius.lg,
  },
  emptyContent: {
    padding: `${theme.spacing[9]} 0`,
  },
  mutedText: {
    color: theme.colors.text.subdued,
  },
});
