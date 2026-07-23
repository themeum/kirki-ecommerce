import { css } from '@emotion/react';
import { useState, useEffect, type ReactNode } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import GroupOptionCard from '@/components/group-option-card';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { BoxOpenIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import { dispatchToastMessage } from '@/pages/utils';
import { useSchemasQuery, useDeleteSchemaMutation } from '@/services/schema';
import type { SchemaProfile } from '@/types';
import { __ } from '@/wpi18n';

import AddSchemaPopup from '@/pages/settings/essential-settings/schema-profile/add-schema-dialog';

type SchemaListItem = SchemaProfile & {
  badge1?: string;
  icon?: ReactNode;
};

const boxWrapperCss = css({
  [`.${CLASS_PREFIX}-box-card`]: {
    borderTop: 'none',
    borderRadius: 'var(--decom-radius-rounded-none)',
  },
  [`.${CLASS_PREFIX}-box-card:first-child`]: {
    borderTop: '1px solid var(--decom-border-border-secondary)',
    borderRadius:
      'var(--decom-radius-rounded-md) var(--decom-radius-rounded-md) var(--decom-radius-rounded-none) var(--decom-radius-rounded-none)',
  },
  [`.${CLASS_PREFIX}-box-card:last-child`]: {
    borderRadius:
      'var(--decom-radius-rounded-none) var(--decom-radius-rounded-none) var(--decom-radius-rounded-md) var(--decom-radius-rounded-md)',
  },
});

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
    <Card type="large">
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
        <Card type="innerDark" style={{ padding: '36px 0' }}>
          <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
            <BoxOpenIcon />
            <span style={{ color: '#878593' }}>
              {__('Added schema profiles will appear here', 'kirki-ecommerce')}
            </span>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" css={boxWrapperCss}>
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
    </Card>
  );
};

SchemaProfileComponent.displayName = 'SchemaProfileComponent';

export default SchemaProfileComponent;
