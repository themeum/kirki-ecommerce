import { useState } from 'react';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { EditIcon, PlusIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import { useProductForm } from '@/contexts/product-form-context';
import { __ } from '@/wpi18n';

import AddOrEditInfo from '@/pages/products/edit-product/additional-info/add-or-edit-info';

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
    <>
      <Text
        header={__('Additional Info', 'kirki-ecommerce')}
        subHeader={__(
          'Share information like return policy or care instructions with your customers.',
          'kirki-ecommerce',
        )}
        type="primary"
      />
      {showInfoForm ? (
        <AddOrEditInfo index={editedIndex} onClose={onClose} />
      ) : (
        <>
          {productData?.additional_info &&
            productData?.additional_info?.length > 0 && (
              <div>
                {productData?.additional_info.map((item, index) => (
                  <Card
                    className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner ${CLASS_PREFIX}-option-card ${CLASS_PREFIX}-hover-parent ${
                      (productData?.additional_info ?? []).length > 1
                        ? `${CLASS_PREFIX}-option-card-border-radius`
                        : `${CLASS_PREFIX}-option-card-border-radius-single`
                    }`}
                    key={index}
                  >
                    <CardContent>
                      <Flex
                        style={{
                          alignItems: 'flex-start',
                        }}
                      >
                        <Text
                          type="primary"
                          header={item?.title}
                          subHeader={item?.description as string | undefined}
                        />
                        <ActionGroup className={`${CLASS_PREFIX}-hover-visible`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onDeleteInfo(index)}
                          >
                            <TrashIcon />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
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
            size="sm"
            onClick={() => setShowInfoForm(true)}
          >
            <PlusIcon />
            {__('Add an Info Section', 'kirki-ecommerce')}
          </Button>
        </>
      )}
    </>
  );
};

AdditionalInfo.displayName = 'AdditionalInfo';

export default AdditionalInfo;
