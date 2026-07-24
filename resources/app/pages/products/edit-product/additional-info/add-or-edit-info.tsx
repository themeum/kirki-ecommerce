import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextareaField from '@/components/form/textarea-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useProductForm } from '@/contexts/product-form-context';
import { cardStyles } from '@/theme/card-styles';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import {
  ProductAdditionalInfoFormSchema,
  type ProductAdditionalInfoFormValues,
} from '@/schemas/forms/product-additional-info-form';
import type { AdditionalInfoItem } from '@/types';
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

  const isSaveDisabled = !titleValue || !descriptionValue;

  return (
    <Card css={cardStyles.innerCard}>
      <CardContent css={cardStyles.innerContent}>
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
                variant="secondary"
                onClick={() => {
                  form.reset({ title: '', description: '' });
                  onClose();
                }}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                disabled={isSaveDisabled}
                onClick={form.handleSubmit(handleSaveInfo)}
              >
                {__('OK', 'kirki-ecommerce')}
              </Button>
            </ActionGroup>
          </Flex>
        </Form>
      </CardContent>
    </Card>
  );
};

AddOrEditInfo.displayName = 'AddOrEditInfo';

export default AddOrEditInfo;

