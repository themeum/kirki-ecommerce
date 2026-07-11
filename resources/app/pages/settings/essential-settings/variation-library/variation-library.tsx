import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import HeaderActionsCard from '@/components/header-actions-card';
import GroupOptionCard from '@/components/group-option-card';
import { CLASS_PREFIX } from '@/conf';
import { BoxIcon, ColorPaletteIcon } from '@/icons';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import { deleteAttributeByIdAPI } from '@/store/attributesSlice';
import { useAppSelector } from '@/store/hooks';
import type { Attribute } from '@/types';
import { __ } from '@/wpi18n';

import { dispatchToastMessage } from '../../../utils';
import AddVariationPopup from './add-variation-popup';

type AttributeListItem = Attribute & {
  badge1?: string;
  icon?: ReactNode;
};

const VariationList = () => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [variationType, setVariationType] = useState<string | null>(null);
  const [attributeListArr, setAttributeListArr] = useState<AttributeListItem[]>([]);

  const attributeList = useAppSelector((state) => state.attributes?.data) || [];

  const handleDeleteVariation = (item: AttributeListItem) => {
    const initialList = [...attributeListArr];
    const updatedAttributeList = attributeListArr?.filter(
      (attribute) => attribute?.id !== item?.id,
    );
    setAttributeListArr(updatedAttributeList);
    dispatchToastMessage('delete', {
      title: __('Attribute deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        setAttributeListArr(initialList);
      },
      onSuccess: async () => {
        await deleteAttributeByIdAPI(item.id);
      },
    });
  };
  const handleEditVariation = (item: AttributeListItem) => {
    if (item?.type === 'color') {
      navigate(`/settings/essential/color/${item?.id}`);
    } else {
      navigate(`/settings/essential/list/${item?.id}`);
    }
  };

  useEffect(() => {
    if (attributeList && attributeList.length) {
      fetchAttributeList();
    }
  }, [attributeList?.length]);

  const fetchAttributeList = () => {
    const formattedAttributes = attributeList.map((item) => ({
      ...item,
      badge1: `${item.values?.length || 0} values`,
      icon: item.type === 'color' ? <ColorPaletteIcon /> : <BoxIcon />,
    }));
    setAttributeListArr(formattedAttributes);
  };

  return (
    <Card type="large">
      <HeaderActionsCard
        header={__('Variation Library', 'kirki-ecommerce')}
        subHeader={__(
          'Used to create tax rates for different product groups, like heavy items needing higher fees.',
          'kirki-ecommerce',
        )}
        dropDownButton
        buttonText={__('Add Variation', 'kirki-ecommerce')}
        handleOptionSelect={(value) => {
          setVariationType(String(value));
          setShowPopup(true);
        }}
      />
      {!attributeListArr.length ? (
        <Card type="innerDark" style={{ padding: '36px 0' }}>
          <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
            <BoxIcon />
            <span style={{ color: '#878593' }}>
              {__('Added variation library will appear here', 'kirki-ecommerce')}
            </span>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" className={`${CLASS_PREFIX}-box-wrapper`}>
          <GroupOptionCard
            dataArr={attributeListArr}
            handleDeleteItem={(item) => handleDeleteVariation(item as AttributeListItem)}
            handleEditItem={(item) => handleEditVariation(item as AttributeListItem)}
          />
        </Flex>
      )}
      <AddVariationPopup
        isOpen={showPopup}
        variationType={variationType}
        onClose={() => setShowPopup(false)}
      />
    </Card>
  );
};

export default VariationList;
