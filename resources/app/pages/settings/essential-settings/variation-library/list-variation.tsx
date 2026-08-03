import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BoxIcon } from '@/icons';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { useAttributeQuery } from '@/services/attribute';
import type { Attribute, AttributeValue, TaxonomyTableHeader } from '@/types';
import { theme } from '@/theme';
import { scoped, mergeCss, defineStyles } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
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
        <Flex direction="column" gap={4}>
          <PageNavbar
            textIcon={<BoxIcon />}
            text={sprintf(__('%s', 'kirki-ecommerce'), selectedAttribute?.name ?? '')}
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
            <Card cssOverride={mergeCss(cardStyles.largeCard, styles.roundedCard)}>
              <CardContent cssOverride={mergeCss(cardStyles.largeContentPadded, styles.emptyContent)}>
                <Flex direction="column" gap={2} align="center">
                  <BoxIcon />
                  <span css={scoped(styles.mutedText)}>
                    {__('No value added yet', 'kirki-ecommerce')}
                  </span>
                </Flex>
              </CardContent>
            </Card>
          ) : (
            <Card cssOverride={cardStyles.tableCard}>
              <CardContent cssOverride={cardStyles.tableContent}>
                <VariationTable
                  tableHeaders={tableHeaders}
                  results={attributeValueList}
                  updateDataList={setAttributeValueList}
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

