import { useState, useEffect, type ReactNode } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import GroupOptionCard from '@/components/group-option-card';
import { CLASS_PREFIX } from '@/conf';
import { useGetListAPI } from '@/hooks';
import { BoxOpenIcon } from '@/icons';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import {
  deleteSchemaByIdAPI,
  getSchemaProfileListAPI,
} from '@/store/schemaSlice';
import { useAppSelector } from '@/store/hooks';
import type { SchemaProfile } from '@/types';
import { __ } from '@/wpi18n';

import { dispatchToastMessage } from '../../../utils';
import AddSchemaPopup from './add-schema-popup';

type SchemaListItem = SchemaProfile & {
  badge1?: string;
  icon?: ReactNode;
};

const SchemaProfileComponent = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [editedItem, setEditedItem] = useState<SchemaProfile | null>(null);
  const [schemaProfileList, setSchemaProfileList] = useState<SchemaListItem[]>([]);

  useGetListAPI({
    reducerName: 'schema',
    apiCallBack: getSchemaProfileListAPI,
  });
  const schemaList = useAppSelector((state) => state.schema);

  useEffect(() => {
    fetchSchemaList();
  }, [schemaList?.data]);

  const fetchSchemaList = () => {
    const updatedSchemaList = schemaList?.data?.map((schema) => {
      return {
        ...schema,
        badge1: `${Object.keys(schema?.schema)?.length} Schemas`,
      };
    });
    setSchemaProfileList(updatedSchemaList ?? []);
  };

  const handleDeleteSchema = (item: SchemaListItem) => {
    const initialList = [...schemaProfileList];
    const updatedSchemaList = schemaProfileList?.filter(
      (schema) => schema?.id !== item?.id,
    );
    setSchemaProfileList(updatedSchemaList);
    dispatchToastMessage('delete', {
      title: __('Schema deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        setSchemaProfileList(initialList);
      },
      onSuccess: async () => {
        await deleteSchemaByIdAPI(item.id);
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
        <Flex direction="column" className={`${CLASS_PREFIX}-box-wrapper`}>
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

export default SchemaProfileComponent;
