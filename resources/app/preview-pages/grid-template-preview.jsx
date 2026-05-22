import React from "react";
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';

import Separator from '@/molecules/separator';
import Text from '@/molecules/text';
import { Select } from '@/molecules/select';

const GridTemplatePreview = () => {
  const optionsArray = [
    { value: "global", title: "Global tax profile" },
    { value: "local", title: "Local tax profile" },
  ];
  return (
    <Card type="form">
      <Text header="Price" subHeader="This is subheading" type="primary" />
      <Grid columns={2}>
        <Input label="Regular price" placeholder="29.00" />
        <Input label="Sale price" placeholder="19.99" />
      </Grid>
      <Grid columns={1}>
        <Flex direction="column" gap={8}>
          <Checkbox label="Charge tax on this product" value={true} />
          <Select
            optionsArray={optionsArray}
            onChange={(value) => console.log(value)}
            onClose={() => console.log("dropdown closed")}
          />
        </Flex>
      </Grid>
      <Separator />
      <Grid columns={3}>
        <Input
          label="Cost of goods"
          placeholder="15.00"
          type="number"
          min={-3}
          max={10}
          onEnter={(value) => console.log(value, "enter")}
          onChange={(value) => console.log(value, "change")}
          onBlur={(value) => console.log(value, "blur")}
        />
        <Input label="Profit" placeholder="4.99" type="number" max={10} />
        <Input label="Margin(%)" placeholder="24.96" type="number" />
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

export default GridTemplatePreview;
