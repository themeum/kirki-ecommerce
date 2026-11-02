import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import type { Category } from '@/features/categories/schemas/catalog/category';
import {
  type CategoryFormInput,
  type CategoryFormPayload,
  CategoryFormSchema,
} from '@/features/categories/schemas/forms/category-form';
import { useCategoriesQuery, useCreateCategoryMutation } from '@/features/categories/services/category';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { pickFormValues } from '@/libs/zod';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type CategoryQuickCreateProps = {
  initialName: string;
  onCancel: () => void;
  onCreated: (category: Category) => void;
};

/**
 * The two questions a category needs, asked inside the picker's own panel:
 * what it is called and what it sits under.
 *
 * Deliberately not a `<form>`. The panel is portalled out of the product
 * form's DOM but not out of its React tree, so a submit event here would
 * bubble into the product form's own handler.
 *
 * @param props Component props.
 *
 * @returns CategoryQuickCreate element.
 */
const CategoryQuickCreate = ({ initialName, onCancel, onCreated }: CategoryQuickCreateProps) => {
  const { data: categoriesData } = useCategoriesQuery({ limit: -1 });
  const createMutation = useCreateCategoryMutation();

  const form = useForm<CategoryFormInput, unknown, CategoryFormPayload>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: pickFormValues(CategoryFormSchema, { name: initialName, parent_id: null }),
  });

  const parentOptions = [
    { label: __('No parent category', 'kirki-ecommerce'), value: '' },
    ...(categoriesData?.results ?? []).map((category) => ({
      label: category.name,
      value: String(category.id),
    })),
  ];

  const handleCreate = async (payload: CategoryFormPayload) => {
    try {
      const response = await createMutation.mutateAsync(payload);
      onCreated(response.data);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const submit = form.handleSubmit(handleCreate);

  return (
    <Form {...form}>
      <Flex direction="column" gap={3}>
        <span css={styles.title}>{__('New category', 'kirki-ecommerce')}</span>
        {/* `TextField` takes no key handler of its own, so Enter is caught
            on the way up instead. */}
        <div
          role="presentation"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void submit();
            }
          }}
        >
          <TextField name="name" placeholder={__('Category name', 'kirki-ecommerce')} />
        </div>
        <SelectField
          name="parent_id"
          options={parentOptions}
          placeholder={__('No parent category', 'kirki-ecommerce')}
        />
        <Flex justify="flex-end" gap={2}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={createMutation.isPending}
            onClick={onCancel}
          >
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={createMutation.isPending}
            onClick={() => {
              void submit();
            }}
          >
            {__('Create', 'kirki-ecommerce')}
          </Button>
        </Flex>
      </Flex>
    </Form>
  );
};

CategoryQuickCreate.displayName = 'CategoryQuickCreate';

export default CategoryQuickCreate;
export type { CategoryQuickCreateProps };

const styles = defineStyles({
  title: {
    ...theme.typography.small('semibold'),
    color: theme.colors.text.primary,
  },
});
