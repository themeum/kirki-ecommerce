import { css } from '@emotion/react';
import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import HeaderActionsCard from '@/components/header-actions-card';
import GroupOptionCard from '@/components/group-option-card';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { BoxIcon, ColorPaletteIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import { dispatchToastMessage } from '@/pages/utils';
import { useAttributesQuery, useDeleteAttributeMutation } from '@/services/attribute';
import type { Attribute } from '@/types';
import { __ } from '@/wpi18n';

import AddVariationPopup from '@/pages/settings/essential-settings/variation-library/add-variation-dialog';

type AttributeListItem = Attribute & {
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

const VariationList = () => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [variationType, setVariationType] = useState<string | null>(null);
  const [attributeListArr, setAttributeListArr] = useState<AttributeListItem[]>([]);

  const { data: attributeList = [], refetch } = useAttributesQuery({ limit: -1 });
  const { mutate: deleteAttribute } = useDeleteAttributeMutation();

  useEffect(() => {
    const formattedAttributes = attributeList.map((item) => ({
      ...item,
      badge1: `${item.values?.length || 0} values`,
      icon: item.type === 'color' ? <ColorPaletteIcon /> : <BoxIcon />,
    }));
    setAttributeListArr(formattedAttributes);
  }, [attributeList]);

  const handleDeleteVariation = (item: AttributeListItem) => {
    const initialList = [...attributeListArr];
    setAttributeListArr((prev) =>
      prev.filter((attribute) => attribute?.id !== item?.id),
    );
    dispatchToastMessage('delete', {
      title: __('Attribute deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        setAttributeListArr(initialList);
      },
      onSuccess: async () => {
        deleteAttribute(item.id as number, { onSuccess: () => refetch() });
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
        <Flex direction="column" css={boxWrapperCss}>
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
        onClose={() => {
          setShowPopup(false);
          refetch();
        }}
      />
    </Card>
  );
};

VariationList.displayName = 'VariationList';

export default VariationList;
