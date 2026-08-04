import { useState } from 'react';

import ColorSwatch from '@/components/ui/color-swatch';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import MultiSelect from '@/components/ui/multi-select';

type ColorOption = {
  value: string;
  title: string;
  color: string;
};

const plainOptions = [
  { value: 'small', title: 'Small' },
  { value: 'medium', title: 'Medium' },
  { value: 'large', title: 'Large' },
  { value: 'x-large', title: 'X-Large' },
];

const colorOptions: ColorOption[] = [
  { value: 'cerulean', title: 'Cerulean', color: '#007ba7' },
  { value: 'crimson', title: 'Crimson', color: '#dc143c' },
  { value: 'moss', title: 'Moss', color: '#8a9a5b' },
];

const withSwatch = (option: ColorOption) => (
  <>
    <ColorSwatch color={option.color} />
    {option.title}
  </>
);

const MultiSelectPreview = () => {
  const [plain, setPlain] = useState<typeof plainOptions>([]);
  const [colors, setColors] = useState<ColorOption[]>([colorOptions[0]]);
  const [creatable, setCreatable] = useState<typeof plainOptions>([]);
  const [failing, setFailing] = useState<typeof plainOptions>([]);

  return (
    <Flex direction="column" gap={6}>
      <Field>
        <FieldLabel>Plain</FieldLabel>
        <MultiSelect
          options={plainOptions}
          value={plain}
          onChange={setPlain}
          placeholder="Select sizes.."
        />
      </Field>

      <Field>
        <FieldLabel>With swatch (renderOption / renderChip)</FieldLabel>
        <MultiSelect
          options={colorOptions}
          value={colors}
          onChange={setColors}
          renderOption={withSwatch}
          renderChip={withSwatch}
          placeholder="Select colours.."
        />
      </Field>

      <Field>
        <FieldLabel>Creatable — resolves</FieldLabel>
        <MultiSelect
          options={plainOptions}
          value={creatable}
          onChange={setCreatable}
          createLabel="Add size"
          placeholder="Type to add a size.."
          onCreate={async (query) => {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setCreatable((prev) => [...prev, { value: query, title: query }]);
          }}
        />
      </Field>

      <Field>
        <FieldLabel>
          Creatable — rejects (popover stays open, text preserved)
        </FieldLabel>
        <MultiSelect
          options={plainOptions}
          value={failing}
          onChange={setFailing}
          createLabel="Add size"
          placeholder="Type to add a size.."
          error
          onCreate={async () => {
            await new Promise((resolve) => setTimeout(resolve, 600));
            throw new Error('Name already taken');
          }}
        />
      </Field>

      <Field>
        <FieldLabel>Disabled</FieldLabel>
        <MultiSelect
          options={plainOptions}
          value={[plainOptions[1]]}
          onChange={() => {}}
          disabled
          placeholder="Select sizes.."
        />
      </Field>
    </Flex>
  );
};

MultiSelectPreview.displayName = 'MultiSelectPreview';

export default MultiSelectPreview;
