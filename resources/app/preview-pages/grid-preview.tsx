import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SelectOption } from '@/types/components/common';

const options: SelectOption[] = [
  { value: 'value-1', title: 'Title 1' },
  { value: 'value-2', title: 'Title 2' },
  { value: 'value-3', title: 'Title 3' },
];

const GridPreview = () => {
  return (
    <Grid columns={3}>
      <Flex direction="column" gap={2}>
        <Label>Input</Label>
        <Input
          placeholder="placeholder text"
          onChange={(event) => console.log(event.target.value)}
        />
      </Flex>
      <div>
        <Input
          placeholder="placeholder text"
          onChange={(event) => console.log(event.target.value)}
        />
      </div>
      <Flex direction="column" gap={2}>
        <Label>Select dropdown 2</Label>
        <Select onValueChange={(value) => console.log(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Flex>
    </Grid>
  );
};

GridPreview.displayName = 'GridPreview';

export default GridPreview;
