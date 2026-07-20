import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextareaField from '@/components/form/textarea-field';
import TextField from '@/components/form/text-field';
import { Form } from '@/components/ui/form';
import { useProductForm } from '@/contexts/product-form-context';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import {
  ProductAdditionalInfoFormSchema,
  type ProductAdditionalInfoFormValues,
} from '@/schemas/forms/product-additional-info-form';
import type { AdditionalInfoItem, ButtonState } from '@/types';
import { __ } from '@/wpi18n';

type AddOrEditInfoProps = {
  index: number | null;
  onClose?: () => void;
};

const AddOrEditInfo = (props: AddOrEditInfoProps) => {
  const { index, onClose = () => {} } = props;
  const { product: productData, updateProduct } = useProductForm();

  const form = useForm<ProductAdditionalInfoFormValues>({
    resolver: zodResolver(ProductAdditionalInfoFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const titleValue = form.watch('title');
  const descriptionValue = form.watch('description');

  useEffect(() => {
    if (index || index === 0) {
      const infoItem = (productData?.additional_info ?? [])[index] as
        | AdditionalInfoItem
        | undefined;
      form.reset({
        title: infoItem?.title ?? '',
        description: (infoItem?.description as string | undefined) ?? '',
      });
      return;
    }

    form.reset({
      title: '',
      description: '',
    });
  }, [index, form]);

  const handleSaveInfo = (values: ProductAdditionalInfoFormValues) => {
    if (index || index === 0) {
      const allData = [...(productData?.additional_info ?? [])];
      allData[index] = values;
      updateProduct({
        key: 'additional_info',
        value: allData,
      });
    } else {
      updateProduct({
        key: 'additional_info',
        value: [...(productData?.additional_info || []), values],
      });
    }
    form.reset({ title: '', description: '' });
    onClose();
  };

  const btnState: ButtonState =
    !titleValue || !descriptionValue ? 'disabled' : '';

  return (
    <Card type="inner">
      <Form {...form}>
        <Flex direction="column" gap={16}>
          <TextField
            name="title"
            label={__('Title', 'kirki-ecommerce')}
            placeholder={__('e.g. Care Instructions', 'kirki-ecommerce')}
          />
          <TextareaField
            name="description"
            label={__('Description', 'kirki-ecommerce')}
            rows={4}
            placeholder={__(
              'e.g. Clean with a damp cloth, avoid harsh chemicals, and store in a cool, dry place. Regular maintenance will keep it lookingnew!',
              'kirki-ecommerce',
            )}
          />
          <ActionGroup>
            <Button
              text={__('Cancel', 'kirki-ecommerce')}
              type="secondary"
              size="small"
              onClick={() => {
                form.reset({ title: '', description: '' });
                onClose();
              }}
            />
            <Button
              text={__('OK', 'kirki-ecommerce')}
              type="primary"
              size="small"
              state={btnState}
              onClick={form.handleSubmit(handleSaveInfo)}
            />
          </ActionGroup>
        </Flex>
      </Form>
    </Card>
  );
};

AddOrEditInfo.displayName = 'AddOrEditInfo';

export default AddOrEditInfo;
