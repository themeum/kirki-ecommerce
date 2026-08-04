import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { EditIcon, PlusIcon, TrashIcon } from '@/icons';
import type { ProductFormValues } from '@/schemas/forms/product-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import AddOrEditInfo from '@/pages/products/product-form/sections/additional-info/add-or-edit-info';

const AdditionalInfo = () => {
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, update, remove } = useFieldArray({
    control,
    name: 'additional_info',
  });
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [editedIndex, setEditedIndex] = useState<number | null>(null);

  const handleClose = () => {
    setEditedIndex(null);
    setShowInfoForm(false);
  };

  const handleEditInfo = (index: number) => {
    setEditedIndex(index);
    setShowInfoForm(true);
  };

  return (
    <Flex direction="column" gap={4}>
      <Flex direction="column" gap={2}>
        <Text weight="semibold">{__('Additional Info', 'kirki-ecommerce')}</Text>
        <Text color="secondary">
          {__(
            'Share information like return policy or care instructions with your customers.',
            'kirki-ecommerce',
          )}
        </Text>
      </Flex>
      {showInfoForm ? (
        <AddOrEditInfo
          index={editedIndex}
          initialValues={
            editedIndex !== null ? fields[editedIndex] : undefined
          }
          onClose={handleClose}
          onSave={(values) => {
            if (editedIndex !== null) {
              update(editedIndex, values);
            } else {
              append(values);
            }
            handleClose();
          }}
        />
      ) : (
        <Flex direction="column" gap={4}>
          {fields.length > 0 && (
            <div css={scoped(styles.wrapper)}>
              {fields.map((item, index) => (
                <Card cssOverride={cardStyles.innerCard} key={item.id}>
                  <CardContent
                    cssOverride={mergeCss(
                      cardStyles.innerCardContent,
                      styles.cardContent,
                    )}
                  >
                    <Flex align="flex-start">
                      <Flex direction="column" gap={2}>
                        <Text variant="small" weight="medium">
                          {item?.title}
                        </Text>
                        <Text variant="small" color="secondary">
                          {item?.description as string | undefined}
                        </Text>
                      </Flex>
                      <ActionGroup
                        cssOverride={styles.actionGroup}
                        data-additional-info-action-group="true"
                      >
                        <Button
                          variant="secondary"
                          onClick={() => remove(index)}
                        >
                          <TrashIcon />
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleEditInfo(index)}
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
    },
  },
  actionGroup: {
    visibility: 'hidden',
    transition: 'visibility 0.2s ease-in-out',
    '&[data-additional-info-action-group="true"]:hover': {
      visibility: 'visible',
    },
  },
});
