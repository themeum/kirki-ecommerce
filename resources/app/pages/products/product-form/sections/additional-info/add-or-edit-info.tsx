import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import TextareaField from '@/components/form/textarea-field';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import {
  type ProductAdditionalInfoFormInput,
  type ProductAdditionalInfoFormPayload,
  ProductAdditionalInfoFormSchema,
} from '@/schemas/forms/product-additional-info-form';
import { cardStyles } from '@/theme/card-styles';
import type { AdditionalInfoItem } from '@/types';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type AddOrEditInfoProps = {
  index: number | null;
  initialValues?: AdditionalInfoItem;
  onClose?: () => void;
  onSave: (values: ProductAdditionalInfoFormPayload) => void;
};

const AddOrEditInfo = ({
  index,
  initialValues,
  onClose = noop,
  onSave,
}: AddOrEditInfoProps) => {
  const form = useForm<ProductAdditionalInfoFormInput, unknown, ProductAdditionalInfoFormPayload>({
    resolver: zodResolver(ProductAdditionalInfoFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const titleValue = form.watch('title');
  const descriptionValue = form.watch('description');

  useEffect(() => {
    if (index !== null && initialValues) {
      form.reset({
        title: initialValues.title ?? '',
        description: initialValues.description ?? '',
      });
      return;
    }

    form.reset({
      title: '',
      description: '',
    });
  }, [index, initialValues, form]);

  const handleSaveInfo = (values: ProductAdditionalInfoFormPayload) => {
    onSave(values);
    form.reset({ title: '', description: '' });
  };

  const isSaveDisabled = !titleValue || !descriptionValue;

  return (
    <Card cssOverride={cardStyles.innerCard}>
      <CardContent cssOverride={cardStyles.innerContent}>
        <Form {...form}>
          <Flex direction="column" gap={4}>
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
