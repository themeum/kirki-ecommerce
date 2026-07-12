import { useState } from 'react';

import { CLASS_PREFIX } from '@/conf';
import { EditIcon, PlusIcon, TrashIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProduct } from '@/store/productSlice';
import { __ } from '@/wpi18n';

import AddOrEditInfo from './add-or-edit-info';

const AdditionalInfo = () => {
  const dispatch = useAppDispatch();
  const { data: productData } = useAppSelector((state) => state.product);
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
    dispatch(
      updateProduct({
        key: 'additional_info',
        value: newDataList,
      }),
    );
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
                    type="inner"
                    key={index}
                    className={`${CLASS_PREFIX}-option-card ${CLASS_PREFIX}-hover-parent ${
                      (productData?.additional_info ?? []).length > 1
                        ? `${CLASS_PREFIX}-option-card-border-radius`
                        : `${CLASS_PREFIX}-option-card-border-radius-single`
                    }`}
                  >
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
                          icon={<TrashIcon />}
                          type="secondary"
                          size="small"
                          onClick={() => onDeleteInfo(index)}
                        />
                        <Button
                          icon={<EditIcon />}
                          type="secondary"
                          size="small"
                          onClick={() => onEditInfo(index)}
                        />
                      </ActionGroup>
                    </Flex>
                  </Card>
                ))}
              </div>
            )}
          <Button
            text={__('Add an Info Section', 'kirki-ecommerce')}
            type="secondary"
            size="small"
            leftIcon={<PlusIcon />}
            onClick={() => setShowInfoForm(true)}
          />
        </>
      )}
    </>
  );
};

AdditionalInfo.displayName = 'AdditionalInfo';

export default AdditionalInfo;
