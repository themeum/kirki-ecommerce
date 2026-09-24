import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
  type MatrixMutation,
  savedVariants,
  useVariantMatrix,
} from '@/features/products/components/product-form/sections/variants/use-variant-matrix';
import type { Attribute } from '@/features/products/schemas/catalog/attribute';
import {
  duplicateAttributeNameMessage,
  findAttributeNameClash,
  type ProductAttributeFormInput,
  type ProductAttributeFormPayload,
  ProductAttributeFormSchema,
} from '@/features/products/schemas/forms/product-attribute-form';
import { useBatchAttributeValuesMutation, useCreateAttributeMutation } from '@/features/products/services/attribute';
import { type ErrorResponse, getErrorsObject } from '@/libs/api';

type ApplyAttributeArgs = {
  form: UseFormReturn<ProductAttributeFormInput, unknown, ProductAttributeFormPayload>;
  attributes: Attribute[];
  appliedId?: number | null;
  onApplied: () => void;
};

type PendingApply = {
  discarded: MatrixMutation['discarded'];
  run: () => Promise<void>;
};

const normalize = (name: string) => name.trim().toLowerCase();

/**
 * Applies a variation card's draft: validates it, confirms first when saved
 * variants would be lost, writes the attribute changes in one request, then
 * commits the result to the product form through the variant matrix.
 */
const useApplyAttribute = ({ form, attributes, appliedId = null, onApplied }: ApplyAttributeArgs) => {
  const { addAttribute, updateAttribute, replaceAttribute, describeDiscarded } = useVariantMatrix();
  const createAttributeMutation = useCreateAttributeMutation();
  const batchMutation = useBatchAttributeValuesMutation();
  const [pending, setPending] = useState<PendingApply | null>(null);

  const isApplying = createAttributeMutation.isPending || batchMutation.isPending;

  const provisionalAttribute = (values: ProductAttributeFormInput): Attribute => ({
    id: appliedId ?? values.source_attribute_id ?? -1,
    name: values.name ?? '',
    values: values.values.map((item, index) => ({
      id: item.id ?? -(index + 1),
      value: item.value,
      color: item.color ?? null,
    })),
  });

  const previewMutation = (values: ProductAttributeFormInput) => {
    const attribute = provisionalAttribute(values);

    return appliedId ? updateAttribute(attribute) : addAttribute(attribute);
  };

  const persist = async (values: ProductAttributeFormInput): Promise<Attribute> => {
    const plan = ProductAttributeFormSchema.parse(values);

    if (plan.kind === 'create') {
      const response = await createAttributeMutation.mutateAsync({
        name: plan.name,
        type: plan.type,
        values: plan.values,
      });

      return response.data;
    }

    if (plan.create.length === 0 && plan.update.length === 0) {
      const cached = attributes.find((attribute) => attribute.id === plan.attribute_id);

      return { id: plan.attribute_id, name: values.name ?? '', type: cached?.type, values: cached?.values ?? [] };
    }

    const response = await batchMutation.mutateAsync({
      attribute_id: plan.attribute_id,
      create: plan.create,
      update: plan.update,
    });

    return response.data;
  };

  const commit = (values: ProductAttributeFormInput, persisted: Attribute) => {
    const persistedByName = new Map((persisted.values ?? []).map((item) => [normalize(item.value), item]));
    const committedValues = values.values
      .map((item) => persistedByName.get(normalize(item.value)))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const committed: Attribute = { id: persisted.id, name: persisted.name, values: committedValues };

    if (!appliedId) {
      addAttribute(committed).commit();
      return;
    }

    if (persisted.id === appliedId) {
      updateAttribute(committed).commit();
      return;
    }

    const valueIdMap = new Map<number, number>();

    values.values.forEach((item) => {
      const next = persistedByName.get(normalize(item.value));

      if (item.id !== undefined && next) {
        valueIdMap.set(item.id, next.id);
      }
    });

    replaceAttribute(appliedId, committed, valueIdMap).commit();
  };

  const run = async (values: ProductAttributeFormInput) => {
    try {
      const persisted = await persist(values);
      commit(values, persisted);
      onApplied();
    } catch (error) {
      const fieldErrors = getErrorsObject((error as ErrorResponse).errors ?? {});

      if (fieldErrors.name) {
        form.setError('name', { message: String(fieldErrors.name) });
      }

      const valuesError = Object.entries(fieldErrors).find(([key]) => /^(values|create|update)(\.|$)/.test(key));

      if (valuesError) {
        form.setError('values', { message: String(valuesError[1]) });
      }
    }
  };

  const apply = async () => {
    const isValid = await form.trigger();
    const values = form.getValues();

    if (findAttributeNameClash(values.name, attributes, values.source_attribute_id)) {
      form.setError('name', { type: 'duplicate', message: duplicateAttributeNameMessage() });
      return;
    }

    if (!isValid) {
      return;
    }

    const discarded = savedVariants(previewMutation(values).discarded);

    if (discarded.length > 0) {
      setPending({ discarded, run: () => run(values) });
      return;
    }

    await run(values);
  };

  const confirmPending = async () => {
    const current = pending;
    setPending(null);
    await current?.run();
  };

  return {
    apply,
    isApplying,
    pending,
    confirmPending,
    cancelPending: () => setPending(null),
    describeDiscarded,
  };
};

export { useApplyAttribute };
