import { useState } from 'react';

import SelectField from '@/components/form/select-field';
import GroupTagTable from '@/components/group-tag-table';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import {
  groupDetails,
  optionsList,
  requiredFields,
} from '@/pages/products/edit-product/seo-settings/utils';

type GroupedValues = Record<string, Array<string | number>>;

const Schema = () => {
  const [selectedValues, setSelectedValues] = useState<GroupedValues>({
    Product: ['name'],
    Offer: ['price'],
  });

  const handleOnSelectionChange = (value: GroupedValues) => {
    setSelectedValues(value);
  };

  const schemaOptions = [
    {
      value: 'default',
      label: __('Default SEO Profile', 'kirki-ecommerce'),
    },
    {
      value: 'custom',
      label: __('Custom SEO Profile', 'kirki-ecommerce'),
    },
  ];

  return (
    <Flex direction="column" gap={16}>
      <SelectField
        name="schema_id"
        label={__('Schema', 'kirki-ecommerce')}
        options={schemaOptions}
      />
      <GroupTagTable
        groupDetails={groupDetails}
        selectedValues={selectedValues}
        optionsArray={optionsList as SelectOption[]}
        requiredFields={requiredFields}
        onChange={(value) => handleOnSelectionChange(value)}
        hasSelect
        isEditable
      />
      <Card type="inner">
        <CardContent>askjdasjdajosidaosij</CardContent>
      </Card>
    </Flex>
  );
};

Schema.displayName = 'Schema';

export default Schema;
