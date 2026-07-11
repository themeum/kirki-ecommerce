import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import { Select } from '@/molecules/select';
import type { SelectOption } from '@/types';

const options: SelectOption[] = [
  { value: 'value-1', title: 'Title 1' },
  { value: 'value-2', title: 'Title 2' },
  { value: 'value-3', title: 'Title 3' },
];

const GridPreview = () => {
  return (
    <Grid columns={3}>
      <div>
        <Input
          placeholder="placeholder text"
          label="Input"
          onChange={(value) => console.log(value)}
        />
      </div>
      <div>
        <Input
          placeholder="placeholder text"
          onChange={(value) => console.log(value)}
        />
      </div>
      <Select
        label="Select dropdown 2"
        optionsArray={options}
        onChange={(value) => console.log(value)}
        onClose={() => console.log('dropdown closed')}
      />
    </Grid>
  );
};

GridPreview.displayName = 'GridPreview';

export default GridPreview;
