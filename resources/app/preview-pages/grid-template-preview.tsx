import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import type { SelectOption } from '@/types';

const optionsArray: SelectOption[] = [
  { value: 'global', title: 'Global tax profile' },
  { value: 'local', title: 'Local tax profile' },
];

const GridTemplatePreview = () => {
  return (
    <Card type="form">
      <Text header="Price" subHeader="This is subheading" type="primary" />
      <Grid columns={2}>
        <Flex direction="column" gap={8}>
          <Label>Regular price</Label>
          <Input placeholder="29.00" />
        </Flex>
        <Flex direction="column" gap={8}>
          <Label>Sale price</Label>
          <Input placeholder="19.99" />
        </Flex>
      </Grid>
      <Grid columns={1}>
        <Flex direction="column" gap={8}>
          <Checkbox label="Charge tax on this product" value={true} />
          <Select onValueChange={(value) => console.log(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {optionsArray.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Flex>
      </Grid>
      <Separator />
      <Grid columns={3}>
        <Flex direction="column" gap={8}>
          <Label>Cost of goods</Label>
          <Input
            placeholder="15.00"
            type="number"
            min={-3}
            max={10}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                console.log(event.currentTarget.value, 'enter');
              }
            }}
            onChange={(event) => console.log(event.target.value, 'change')}
            onBlur={(event) => console.log(event.target.value, 'blur')}
          />
        </Flex>
        <Flex direction="column" gap={8}>
          <Label>Profit</Label>
          <Input placeholder="4.99" type="number" max={10} />
        </Flex>
        <Flex direction="column" gap={8}>
          <Label>Margin(%)</Label>
          <Input placeholder="24.96" type="number" />
        </Flex>
      </Grid>

      <Card type="inner">
        <Text
          header="Limit Orders to One Item"
          subHeader="Let customers purchase only one item in a single order. Particularly use full for items that are limited in quantity i.e. handmade items"
          type="secondary"
        />
      </Card>
    </Card>
  );
};

GridTemplatePreview.displayName = 'GridTemplatePreview';

export default GridTemplatePreview;
