import { useEffect, useState } from 'react';

import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProduct } from '@/store/productSlice';
import type { AdditionalInfoItem } from '@/types';
import { __ } from '@/wpi18n';

type AddOrEditInfoProps = {
  index: number | null;
  onClose?: () => void;
};

type InfoFormData = {
  title?: string;
  description?: string;
};

const AddOrEditInfo = (props: AddOrEditInfoProps) => {
  const { index, onClose = () => {} } = props;
  const dispatch = useAppDispatch();
  const { data: productData } = useAppSelector((state) => state.product);
  const [infoData, setInfoData] = useState<InfoFormData>({});

  useEffect(() => {
    if (index || index === 0) {
      const infoItem = (productData?.additional_info ?? [])[index] as
        | AdditionalInfoItem
        | undefined;
      setInfoData({
        title: infoItem?.title,
        description: infoItem?.description as string | undefined,
      });
    }
  }, [index]);

  const handleOnChange = (value: unknown, fieldName: string) => {
    setInfoData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const onSaveInfo = () => {
    if (index || index === 0) {
      const allData = [...(productData?.additional_info ?? [])];
      allData[index] = infoData;
      dispatch(
        updateProduct({
          key: 'additional_info',
          value: allData,
        }),
      );
    } else {
      dispatch(
        updateProduct({
          key: 'additional_info',
          value: [...(productData?.additional_info || []), infoData],
        }),
      );
    }
    setInfoData({});
    onClose();
  };

  return (
    <Card type="inner">
      <Flex direction="column" gap={16}>
        <Input
          label={__('Title', 'kirki-ecommerce')}
          placeholder={__('e.g. Care Instructions', 'kirki-ecommerce')}
          value={infoData?.title || ''}
          onChange={(value) => handleOnChange(value, 'title')}
        />
        <Input
          label={__('Description', 'kirki-ecommerce')}
          multiline={4}
          value={infoData?.description || ''}
          placeholder={__(
            'e.g. Clean with a damp cloth, avoid harsh chemicals, and store in a cool, dry place. Regular maintenance will keep it lookingnew!',
            'kirki-ecommerce',
          )}
          onChange={(value) => handleOnChange(value, 'description')}
        />
        <ActionGroup>
          <Button
            text={__('Cancel', 'kirki-ecommerce')}
            type="secondary"
            size="small"
            onClick={() => {
              setInfoData({});
              onClose();
            }}
          />
          <Button
            text={__('OK', 'kirki-ecommerce')}
            type="primary"
            size="small"
            state={!infoData.title || !infoData?.description ? 'disabled' : ''}
            onClick={onSaveInfo}
          />
        </ActionGroup>
      </Flex>
    </Card>
  );
};

AddOrEditInfo.displayName = 'AddOrEditInfo';

export default AddOrEditInfo;
