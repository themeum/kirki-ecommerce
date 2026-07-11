type AttributeValue = {
  id: number;
  value: string;
  color?: string;
};

type Attribute = {
  id: number;
  name: string;
  type: string;
  values?: AttributeValue[];
};

type AttributeFormData = {
  name?: string;
  type?: string;
  values?: AttributeValue[];
  [key: string]: unknown;
};

type AttributeValueFormData = {
  attribute_id: number;
  value_id?: number;
  value?: string;
  color?: string;
  [key: string]: unknown;
};

export type { Attribute, AttributeValue, AttributeFormData, AttributeValueFormData };
