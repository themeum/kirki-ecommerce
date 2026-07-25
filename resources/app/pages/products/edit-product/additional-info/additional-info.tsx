import { css } from '@emotion/react';
import { useState } from 'react';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EditIcon, PlusIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { useProductForm } from '@/contexts/product-form-context';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import AddOrEditInfo from '@/pages/products/edit-product/additional-info/add-or-edit-info';

const hoverVisibleCss = css({
  visibility: 'hidden',
});

const hoverVisibleActiveCss = css({
  visibility: 'visible',
});

const optionCardCss = css({
  borderRadius: theme.radius.none,
  borderTopColor: 'transparent',
});

const optionCardBorderRadiusCss = css({
  '&:first-of-type': {
    borderTopColor: theme.colors.border.secondary,
    borderRadius: `${theme.radius.lg} ${theme.radius.lg} ${theme.radius.none} ${theme.radius.none}`,
  },
  '&:last-of-type': {
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
  },
});

const optionCardBorderRadiusSingleCss = css({
  borderRadius: theme.radius.lg,
});

const AdditionalInfo = () => {
  const { product: productData, updateProduct } = useProductForm();
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [editedIndex, setEditedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const onClose = () => {
    setEditedIndex(null);
    setShowInfoForm(false);
  };

  const onEditInfo = (index: number) => {
    setEditedIndex(index);
    setShowInfoForm(true);
  };

  const onDeleteInfo = (deletedIndex: number) => {
    const newDataList = (productData?.additional_info ?? []).filter(
      (_item, index) => index !== deletedIndex,
    );
    updateProduct({
      key: 'additional_info',
      value: newDataList,
    });
  };

  return (
    <>
      <Flex direction="column" gap={2}>
        <Text weight="semibold">{__('Additional Info', 'kirki-ecommerce')}</Text>
        <Text color="secondary">{__(
          'Share information like return policy or care instructions with your customers.',
          'kirki-ecommerce',
        )}</Text>
      </Flex>
      {showInfoForm ? (
        <AddOrEditInfo index={editedIndex} onClose={onClose} />
      ) : (
        <>
          {productData?.additional_info &&
            productData?.additional_info?.length > 0 && (
              <div>
                {productData?.additional_info.map((item, index) => (
                  <Card
                    css={css(
                      cardStyles.innerCard,
                      optionCardCss,
                      (productData?.additional_info ?? []).length > 1
                        ? optionCardBorderRadiusCss
                        : optionCardBorderRadiusSingleCss,
                    )}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    key={index}
                  >
                    <CardContent>
                      <Flex
                        align="flex-start">
                        <Flex direction="column" gap={2}>
                          <Text weight="semibold">{item?.title}</Text>
                          <Text color="secondary">{item?.description as string | undefined}</Text>
                        </Flex>
                        <ActionGroup
                          css={css(
                            hoverVisibleCss,
                            hoveredIndex === index && hoverVisibleActiveCss,
                          )}
                        >
                          <Button
                            variant="secondary"
                            onClick={() => onDeleteInfo(index)}
                          >
                            <TrashIcon />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => onEditInfo(index)}
                          >
                            <EditIcon />
                          </Button>
                        </ActionGroup>
                      </Flex>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          <Button
            variant="secondary"
            onClick={() => setShowInfoForm(true)}
          >
            <PlusIcon />
            {__('Add an Info Section', 'kirki-ecommerce')}
          </Button>
        </>
      )}
    </>
  );
};

AdditionalInfo.displayName = 'AdditionalInfo';

export default AdditionalInfo;

