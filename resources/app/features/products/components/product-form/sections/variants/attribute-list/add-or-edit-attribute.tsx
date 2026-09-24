import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';

import ConfirmationDialog from '@/components/modal/confirmation-dialog';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import AttributeNameInput from '@/features/products/components/fields/attribute-name-input';
import AttributeValuesField from '@/features/products/components/fields/attribute-values-field';
import { useApplyAttribute } from '@/features/products/components/product-form/sections/variants/attribute-list/use-apply-attribute';
import { savedVariants } from '@/features/products/components/product-form/sections/variants/use-variant-matrix';
import type { Attribute } from '@/features/products/schemas/catalog/attribute';
import {
  type ProductAttributeFormInput,
  type ProductAttributeFormPayload,
  ProductAttributeFormSchema,
  toProductAttributeFormValues,
} from '@/features/products/schemas/forms/product-attribute-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

type AddOrEditAttributeProps = {
  /** Every attribute in the store, for its values and for the name check. */
  attributes: Attribute[];
  /** The store attribute the card starts from; absent for a brand-new one. */
  source?: Attribute | null;
  /** The attribute as currently applied to the product, when editing one. */
  applied?: Attribute | null;
  onClose: () => void;
  onDelete?: () => void;
};

/**
 * A variation card in edit mode: an inline name, the value picker, and
 * Delete / Cancel / Apply. Everything stays a draft in this card's own form
 * until Apply, so Cancel only has to drop the form.
 *
 * @param props Component props.
 *
 * @returns AddOrEditAttribute element.
 * @since 1.0.0
 */
const AddOrEditAttribute = ({ attributes, source = null, applied = null, onClose, onDelete }: AddOrEditAttributeProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const form = useForm<ProductAttributeFormInput, unknown, ProductAttributeFormPayload>({
    resolver: zodResolver(ProductAttributeFormSchema),
    defaultValues: toProductAttributeFormValues(source ?? applied, applied?.values ?? []),
  });

  const { apply, isApplying, pending, confirmPending, cancelPending, describeDiscarded } = useApplyAttribute({
    form,
    attributes,
    appliedId: applied?.id ?? null,
    onApplied: onClose,
  });

  const isNew = !source && !applied;
  const pendingCount = pending ? savedVariants(pending.discarded).length : 0;

  return (
    <Form {...form}>
      <div ref={cardRef}>
        <Card cssOverride={cardStyles.innerCard}>
          <CardContent cssOverride={cardStyles.innerCardContent}>
            <Flex direction="column" gap={3}>
              <AttributeNameInput attributes={attributes} focusOnMount={isNew} />
              <AttributeValuesField
                existingValues={source?.values ?? applied?.values ?? []}
                type={source?.type ?? 'list'}
                anchorRef={cardRef}
              />
              <Flex align="center" justify="space-between" cssOverride={styles.actions}>
                {isNew ? (
                  <span />
                ) : (
                  <Button variant="link" cssOverride={styles.delete} onClick={applied ? onDelete : onClose}>
                    {__('Delete', 'kirki-ecommerce')}
                  </Button>
                )}
                <ActionGroup>
                  <Button variant="secondary" onClick={onClose}>
                    {__('Cancel', 'kirki-ecommerce')}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={isApplying}
                    onClick={() => {
                      void apply();
                    }}
                  >
                    {__('Apply', 'kirki-ecommerce')}
                  </Button>
                </ActionGroup>
              </Flex>
            </Flex>
          </CardContent>
        </Card>
      </div>
      {!!pending && (
        <ConfirmationDialog
          variant="delete"
          title={__('Remove variations?', 'kirki-ecommerce')}
          subtitle={sprintf(
            _n(
              '%1$d saved variation will be deleted when you save this product: %2$s',
              '%1$d saved variations will be deleted when you save this product: %2$s',
              pendingCount,
              'kirki-ecommerce',
            ),
            pendingCount,
            describeDiscarded(pending.discarded),
          )}
          onConfirm={() => {
            void confirmPending();
          }}
          onCancel={cancelPending}
        />
      )}
    </Form>
  );
};

AddOrEditAttribute.displayName = 'AddOrEditAttribute';

export default AddOrEditAttribute;

const styles = defineStyles({
  actions: {
    marginTop: theme.spacing[1],
  },
  delete: {
    height: 'auto',
    padding: 0,
    color: theme.colors.text.critical,
    '&:hover': {
      textDecoration: 'none',
    },
  },
});
