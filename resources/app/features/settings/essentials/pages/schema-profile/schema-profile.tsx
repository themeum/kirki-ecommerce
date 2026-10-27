import { ScrollText } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
} from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import AddSchemaPopup from '@/features/settings/essentials/pages/schema-profile/add-schema-dialog';
import type { SchemaProfile } from '@/features/settings/essentials/schemas/catalog/schema-profile';
import {
  useDeleteSchemaMutation,
  useSchemasQuery,
} from '@/features/settings/essentials/services/schema';
import StackedListSkeleton from '@/features/settings/skeletons/stacked-list-skeleton';
import { useConfirmDelete } from '@/hooks';
import { EditPenIcon, TrashIcon } from '@/icons/common';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type SchemaListItem = SchemaProfile & {
  badge1?: string;
  icon?: ReactNode;
};

const countSchemaProperties = (schema: SchemaListItem) => {
  return Object.values(schema.schema).reduce((total, item) => total + item.length, 0) ?? 0;
};

const SchemaProfileComponent = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [editedItem, setEditedItem] = useState<SchemaProfile | null>(null);

  const { data: schemaList = [], isLoading, refetch } = useSchemasQuery();
  const { mutate: deleteSchema } = useDeleteSchemaMutation();

  const schemaProfileList = useMemo<SchemaListItem[]>(
    () =>
      schemaList.map((schema) => ({
        ...schema,
        badge1: `${Object.keys(schema?.schema)?.length} Schemas`,
      })),
    [schemaList],
  );

  const { confirmDelete, deleteConfirmation } = useConfirmDelete();

  const handleDeleteSchema = (item: SchemaListItem) => {
    confirmDelete(
      {
        title: __('Delete schema?', 'kirki-ecommerce'),
        description: __(
          'This schema will be permanently deleted. This cannot be undone.',
          'kirki-ecommerce',
        ),
      },
      () => {
        deleteSchema(item.id, { onSuccess: () => refetch() });
      },
    );
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
    <Card
      data-search-id="essentials.schema-profile"
      data-search-keywords="seo, json ld, rich snippet, google, metadata"
      cssOverride={cardStyles.formCard}
    >
      <CardContent>
        <HeaderActionsCard
          header={__('Schemas', 'kirki-ecommerce')}
          subHeader={__(
            'Structured data properties attached to products for richer search listings.',
            'kirki-ecommerce',
          )}
          buttonText={__('Schema', 'kirki-ecommerce')}
          onAdd={() => setShowPopup(true)}
        />
        <div
          css={scoped({
            marginTop: schemaProfileList.length === 0 ? theme.spacing[0] : theme.spacing[5],
          })}
        >
          {isLoading ? (
            <StackedListSkeleton hasMedia={false} />
          ) : (
            schemaProfileList.length > 0 && (
              <StackedItems>
                {schemaProfileList.map((item) => (
                  <StackedItem key={item.id} id={String(item.id)}>
                    <StackedItemMedia>
                      <ScrollText size={16} />
                    </StackedItemMedia>
                    <StackedItemContent>
                      <StackedItemTitle>
                        <Text variant="small" weight="medium">
                          {item.name}
                        </Text>
                        {countSchemaProperties(item) > 0 && (
                          <Badge>
                            {sprintf(
                              __('%d Properties', 'kirki-ecommerce'),
                              countSchemaProperties(item),
                            )}
                          </Badge>
                        )}
                        {item.is_default && <Badge>{__('Default', 'kirki-ecommerce')}</Badge>}
                      </StackedItemTitle>
                    </StackedItemContent>
                    <StackedItemActions>
                      <ActionGroup>
                        <Button
                          variant="tertiary"
                          size="icon-sm"
                          aria-label={__('Delete', 'kirki-ecommerce')}
                          cssOverride={mergeCss(styles.actionButton, {
                            '& svg': { color: theme.colors.icon.critical },
                          })}
                          onClick={() => handleDeleteSchema(item)}
                        >
                          <TrashIcon />
                        </Button>
                        <Button
                          variant="tertiary"
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
            )
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
      {deleteConfirmation}
    </Card>
  );
};

SchemaProfileComponent.displayName = 'SchemaProfileComponent';

export default SchemaProfileComponent;

const styles = defineStyles({
  actionButton: {
    padding: theme.spacing[1],
  },
});
