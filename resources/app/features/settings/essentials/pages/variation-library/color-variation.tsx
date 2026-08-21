import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import type { Attribute, AttributeValue } from '@/features/products';
import { useAttributeQuery } from '@/features/products';
import VariationTable from '@/features/settings/essentials/pages/variation-library/variation-table/variation-table';
import VariationValuePopup from '@/features/settings/essentials/pages/variation-library/variation-value-dialog';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { ColorPaletteIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type AttributeWithMeta = Attribute & { updated_at?: string };

const ColorVariation = () => {
  const { id } = useParams();
  const { data: selectedItem } = useAttributeQuery(Number(id), Boolean(id));

  const navigate = useNavigate();

  const [colorList, setColorList] = useState<AttributeValue[]>([]);
  const [addVariantPopup, setAddVariantPopup] = useState(false);
  const selectedAttribute = selectedItem as AttributeWithMeta | undefined;

  useEffect(() => {
    setColorList(selectedAttribute?.values ?? []);
  }, [selectedAttribute]);

  return (
    <div>
      <Container size="sm">
        <Flex direction="column" gap={4}>
          <SettingsPageHeader
            icon={<ColorPaletteIcon />}
            title={selectedItem?.name ?? __('Color', 'kirki-ecommerce')}
            onBack={() => navigate('/settings/essentials')}
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
            <Card cssOverride={mergeCss(cardStyles.formCard, styles.roundedCard)}>
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
            <VariationTable
              results={colorList}
              updateDataList={setColorList}
              selectedItem={selectedAttribute}
            />
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

const styles = defineStyles({
  addColorButton: {
    color: theme.colors.text.emphasis,
    padding: theme.spacing[0],
  },
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
