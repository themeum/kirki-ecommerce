type AttributeType = 'color' | 'list';

type AttributeValue = {
  id: number;
  value: string;
  color?: string | null;
};

type Attribute = {
  id: number;
  name: string;
  slug?: string;
  type: AttributeType | string;
  values?: AttributeValue[];
  created_at?: string;
  updated_at?: string;
};

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

export type {
  AttributeType,
  Attribute,
  AttributeValue,
  AttributeFormData,
  AttributeValueFormData,
};
