import { useState, useEffect, type ReactNode } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import GroupOptionCard from '@/components/group-option-card';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { BoxOpenIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import { dispatchToastMessage } from '@/pages/utils';
import { useSchemasQuery, useDeleteSchemaMutation } from '@/services/schema';
import type { SchemaProfile } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import AddSchemaPopup from '@/pages/settings/essential-settings/schema-profile/add-schema-dialog';

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
      onSuccess: async () => {
        deleteSchema(item.id as number, { onSuccess: () => refetch() });
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
    <Card css={cardStyles.largeCard}>
      <CardContent css={cardStyles.largeContentPadded}>
        <HeaderActionsCard
          header={__('Schema Profile', 'kirki-ecommerce')}
          subHeader={__(
            'Used to create tax rates for different product groups, like heavy items needing higher fees.',
            'kirki-ecommerce',
          )}
          buttonText={__('Add Profile', 'kirki-ecommerce')}
          onAdd={() => setShowPopup(true)}
        />
        {!schemaProfileList?.length ? (
          <Card css={cardStyles.innerDarkCard}>
            <CardContent css={[cardStyles.innerDarkContent, styles.emptyState]}>
              <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
                <BoxOpenIcon />
                <span css={styles.emptyStateText}>
                  {__('Added schema profiles will appear here', 'kirki-ecommerce')}
                </span>
              </Flex>
            </CardContent>
          </Card>
        ) : (
          <Flex direction="column" data-box-wrapper css={styles.boxWrapper}>
            <GroupOptionCard
              dataArr={schemaProfileList}
              handleDeleteItem={(item) => handleDeleteSchema(item as SchemaListItem)}
              handleEditItem={(item) => handleEditSchema(item as SchemaListItem)}
            />
          </Flex>
        )}
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

const styles = {
  boxWrapper: scoped({
    '[data-box-card]': {
      borderTop: 'none',
      borderRadius: theme.radius.none,
    },
    '[data-box-card]:first-of-type': {
      borderTop: `1px solid ${theme.colors.border.secondary}`,
      borderRadius: `${theme.radius.md} ${theme.radius.md} ${theme.radius.none} ${theme.radius.none}`,
    },
    '[data-box-card]:last-of-type': {
      borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.md} ${theme.radius.md}`,
    },
  }),
  emptyState: scoped({
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  }),
  emptyStateText: scoped({
    color: theme.colors.text.subdued,
  })
};
