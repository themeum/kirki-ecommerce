import { type ReactNode, useEffect, useState } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItems,
  StackedItemTitle,
} from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import { BoxOpenIcon, EditPenIcon, TrashIcon } from '@/icons';
import AddSchemaPopup from '@/pages/settings/essential-settings/schema-profile/add-schema-dialog';
import { dispatchToastMessage } from '@/pages/utils';
import type { SchemaProfile } from '@/schemas/catalog/schema-profile';
import { useDeleteSchemaMutation, useSchemasQuery } from '@/services/schema';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SchemaListItem = SchemaProfile & {
  badge1?: string;
  icon?: ReactNode;
};

const SchemaProfileComponent = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [editedItem, setEditedItem] = useState<SchemaProfile | null>(null);
  const [schemaProfileList, setSchemaProfileList] = useState<SchemaListItem[]>([]);

  const { data: schemaList = [], refetch } = useSchemasQuery();
  const { mutate: deleteSchema } = useDeleteSchemaMutation();

  useEffect(() => {
    const updatedSchemaList = schemaList.map((schema) => {
      return {
        ...schema,
        badge1: `${Object.keys(schema?.schema)?.length} Schemas`,
      };
    });
    setSchemaProfileList(updatedSchemaList);
  }, [schemaList]);

  const handleDeleteSchema = (item: SchemaListItem) => {
    const initialList = [...schemaProfileList];
    setSchemaProfileList((prev) =>
      prev.filter((schema) => schema?.id !== item?.id),
    );
    dispatchToastMessage('delete', {
      title: __('Schema deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        setSchemaProfileList(initialList);
      },
      onSuccess: () => {
        deleteSchema(item.id, { onSuccess: () => refetch() });
      },
    });
  };

  const handleEditSchema = (item: SchemaListItem) => {
    setEditedItem(item);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setEditedItem(null);
  };

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardContent >
        <HeaderActionsCard
          header={__('Schema Profile', 'kirki-ecommerce')}
          subHeader={__(
            'Used to create tax rates for different product groups, like heavy items needing higher fees.',
            'kirki-ecommerce',
          )}
          buttonText={__('Add Profile', 'kirki-ecommerce')}
          onAdd={() => setShowPopup(true)}
        />
        <div css={scoped({ marginTop: theme.spacing[5] })}>
          {!schemaProfileList?.length ? (
            <Card cssOverride={cardStyles.innerDarkCard}>
              <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyState)}>
                <Flex direction="column" gap={2} align="center">
                  <BoxOpenIcon />
                  <span css={scoped(styles.emptyStateText)}>
                    {__('Added schema profiles will appear here', 'kirki-ecommerce')}
                  </span>
                </Flex>
              </CardContent>
            </Card>
          ) : (
            <StackedItems>
              {schemaProfileList.map((item) => (
                <StackedItem key={item.id} id={String(item.id)}>
                  <StackedItemContent>
                    <StackedItemTitle>
                      <Text variant="small" weight="medium">
                        {item.name}
                      </Text>
                      {item.is_default && (
                        <Badge variant="secondary">
                          {__('Default', 'kirki-ecommerce')}
                        </Badge>
                      )}
                    </StackedItemTitle>
                  </StackedItemContent>
                  <StackedItemActions>
                    <ActionGroup>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={__('Delete', 'kirki-ecommerce')}
                        cssOverride={styles.actionButton}
                        onClick={() => handleDeleteSchema(item)}
                      >
                        <TrashIcon />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={__('Edit', 'kirki-ecommerce')}
                        cssOverride={styles.actionButton}
                        onClick={() => handleEditSchema(item)}
                      >
                        <EditPenIcon />
                      </Button>
                    </ActionGroup>
                  </StackedItemActions>
                </StackedItem>
              ))}
            </StackedItems>
          )}
        </div>
        {showPopup && (
          <AddSchemaPopup
            isOpen={showPopup}
            onClose={handleClosePopup}
            editedItem={editedItem}
            setEditedItem={setEditedItem}
          />
        )}
      </CardContent>
    </Card>
  );
};

SchemaProfileComponent.displayName = 'SchemaProfileComponent';

export default SchemaProfileComponent;

const styles = defineStyles({
  emptyState: {
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  },
  emptyStateText: {
    color: theme.colors.text.subdued,
  },
  actionButton: {
    padding: theme.spacing[1],
  },
});
