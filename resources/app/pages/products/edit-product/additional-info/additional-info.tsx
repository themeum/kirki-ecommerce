import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { useState } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { useProductForm } from '@/contexts/product-form-context';
import { EditIcon, PlusIcon, TrashIcon } from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import AddOrEditInfo from '@/pages/products/edit-product/additional-info/add-or-edit-info';
import { theme } from '@/theme';

// const optionCardCss = css({
//   borderRadius: theme.radius.none,
//   borderTopColor: 'transparent',
// });

// const optionCardBorderRadiusCss = css({
//   '&:first-of-type': {
//     borderTopColor: theme.colors.border.secondary,
//     borderRadius: `${theme.radius.lg} ${theme.radius.lg} ${theme.radius.none} ${theme.radius.none}`,
//   },
//   '&:last-of-type': {
//     borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
//   },
// });

// const optionCardBorderRadiusSingleCss = css({
//   borderRadius: theme.radius.lg,
// });

const AdditionalInfo = () => {
  const { product: productData, updateProduct } = useProductForm();
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [editedIndex, setEditedIndex] = useState<number | null>(null);

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
    <Flex direction="column" gap={4}>
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
        <Flex direction="column" gap={4}>
          {productData?.additional_info &&
            productData?.additional_info?.length > 0 && (
              <div css={scoped(styles.wrapper)}>
                {productData?.additional_info.map((item, index) => (
                  <Card
                    cssOverride={cardStyles.innerCard}
                    key={index}
                  >
                    <CardContent cssOverride={mergeCss(cardStyles.innerCardContent, styles.cardContent)}>
                      <Flex
                        align="flex-start">
                        <Flex direction="column" gap={2}>
                          <Text variant='small' weight="medium">{item?.title}</Text>
                          <Text variant='small' color="secondary">{item?.description as string | undefined}</Text>
                        </Flex>
                        <ActionGroup
                          cssOverride={styles.actionGroup}
                          data-additional-info-action-group="true"
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
        </Flex>
      )}
    </Flex>
  );
};

AdditionalInfo.displayName = 'AdditionalInfo';

export default AdditionalInfo;

const styles = defineStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
  },
  cardContent: {
    '&:hover': {
      '[data-additional-info-action-group]': {
        visibility: 'visible',
      },
    }
  },
  actionGroup: {
    visibility: 'hidden',
    transition: 'visibility 0.2s ease-in-out',
    '&[data-additional-info-action-group="true"]:hover': {
      visibility: 'visible',
    },
  },
});