export type {
  AttributeType,
  Attribute,
  AttributeValue,
} from '@/schemas/catalog/attribute';

import type { AttributeType, AttributeValue } from '@/schemas/catalog/attribute';

type AttributeFormData = {
  name?: string;
  type?: AttributeType | string;
  values?: AttributeValue[];
};

type AttributeValueFormData = {
  attribute_id: number;
  value_id?: number;
  value?: string;
  color?: string | null;
};

export type { AttributeFormData, AttributeValueFormData };
