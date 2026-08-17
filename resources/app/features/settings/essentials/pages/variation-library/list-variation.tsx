import { Box } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { RouteConfig } from '@/config/route-config';
import type { Attribute, AttributeValue } from '@/features/products';
import { useAttributeQuery } from '@/features/products';
import VariationTable from '@/features/settings/essentials/pages/variation-library/variation-table/variation-table';
import VariationValuePopup from '@/features/settings/essentials/pages/variation-library/variation-value-dialog';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { BoxIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type AttributeWithMeta = Attribute & { updated_at?: string };

const ListVariation = () => {
  const { id } = useParams();
  const { data: selectedItem } = useAttributeQuery(Number(id), Boolean(id));
  const navigate = useNavigate();

  const [attributeValueList, setAttributeValueList] = useState<AttributeValue[]>([]);
  const [addVariantPopup, setAddVariantPopup] = useState(false);
  const selectedAttribute = selectedItem as AttributeWithMeta | undefined;

  useEffect(() => {
    setAttributeValueList(selectedAttribute?.values ?? []);
  }, [selectedAttribute]);

  return (
    <div>
      <Container size="sm">
        <Flex direction="column" gap={4}>
          <SettingsPageHeader
            icon={<BoxIcon />}
            title={sprintf(__('%s', 'kirki-ecommerce'), selectedAttribute?.name ?? '')}
            onBack={() => { void navigate(RouteConfig.Settings.get('EssentialsSettings').buildLink()); }}
            rightAction={
              <div>
                <Button
                  variant="link"
                  cssOverride={styles.addValueButton}
                  onClick={() => setAddVariantPopup(true)}
                >
                  {__('Add value', 'kirki-ecommerce')}
                </Button>
              </div>
            }
          />
          {!attributeValueList?.length ? (
            <Card cssOverride={mergeCss(cardStyles.formCard, styles.roundedCard)}>
              <CardContent cssOverride={mergeCss(cardStyles.largeContentPadded, styles.emptyContent)}>
                <Flex direction="column" gap={2} align="center">
                  <Box />
                  <span css={scoped(styles.mutedText)}>
                    {__('No value added yet', 'kirki-ecommerce')}
                  </span>
                </Flex>
              </CardContent>
            </Card>
          ) : (
            <VariationTable
              results={attributeValueList}
              updateDataList={setAttributeValueList}
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

ListVariation.displayName = 'ListVariation';

export default ListVariation;

const styles = defineStyles({
  addValueButton: {
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

