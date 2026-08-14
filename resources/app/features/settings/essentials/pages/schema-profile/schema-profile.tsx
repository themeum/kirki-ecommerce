import { type ReactNode, useMemo, useState } from 'react';

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
import AddSchemaPopup from '@/features/settings/essentials/pages/schema-profile/add-schema-dialog';
import type { SchemaProfile } from '@/features/settings/essentials/schemas/catalog/schema-profile';
import { useDeleteSchemaMutation, useSchemasQuery } from '@/features/settings/essentials/services/schema';
import StackedListSkeleton from '@/features/settings/skeletons/stacked-list-skeleton';
import { BoxOpenIcon, EditPenIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { dispatchToastMessage } from '@/utils/common';
import { __ } from '@/wpi18n';

type SchemaListItem = SchemaProfile & {
  badge1?: string;
  icon?: ReactNode;
};

const SchemaProfileComponent = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [editedItem, setEditedItem] = useState<SchemaProfile | null>(null);
  const [removedIds, setRemovedIds] = useState<number[]>([]);

  const { data: schemaList = [], isLoading, refetch } = useSchemasQuery();
  const { mutate: deleteSchema } = useDeleteSchemaMutation();

  const schemaProfileList = useMemo<SchemaListItem[]>(
    () =>
      schemaList
        .filter((schema) => !removedIds.includes(schema.id))
        .map((schema) => ({
          ...schema,
          badge1: `${Object.keys(schema?.schema)?.length} Schemas`,
        })),
    [schemaList, removedIds],
  );

  const handleDeleteSchema = (item: SchemaListItem) => {
    setRemovedIds((prev) => [...prev, item.id]);
    dispatchToastMessage('delete', {
      title: __('Schema deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        setRemovedIds((prev) => prev.filter((id) => id !== item.id));
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
          {isLoading ? (
            <StackedListSkeleton hasMedia={false} />
          ) : !schemaProfileList?.length ? (
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
