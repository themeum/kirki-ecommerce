import Card from '@/molecules/card';
import Flex from '@/molecules/flex';

import React from "react";
import Tags from './tags';
import Collections from './collections';
import Brand from './brand';
import { useSelector } from "react-redux";
import { __ } from "@/wpi18n";
import Categories from './categories/categories';
import { Select } from '@/molecules/select';

const RightPanel = ({ handleOnChange, errors, setErrors }) => {
  const { loaded, data: productData } = useSelector((state) => state.product);

  return (
    <div style={{ width: "30%" }}>
      <Flex direction="column" gap={16}>
        <Card type="form">
          <Select
            value={productData?.status}
            label={__("Status", "kirki-ecommerce")}
            optionsArray={[
              { value: "draft", title: __("Draft", "kirki-ecommerce") },
              { value: "published", title: __("Published", "kirki-ecommerce") },
              { value: "unpublished", title: __("Unpublished", "kirki-ecommerce") },
              { value: "archived", title: __("Archived", "kirki-ecommerce") },
            ]}
            onChange={(value) => handleOnChange(value, "status")}
            onClose={() => console.log("dropdown closed")}
            error={errors?.status}
          />
        </Card>
        <Categories errors={errors} setErrors={setErrors} />
        <Card type="form">
          <Tags errors={errors} setErrors={setErrors} />
          <Collections errors={errors} setErrors={setErrors} />
          <Brand />
        </Card>
      </Flex>
    </div>
  );
};

export default RightPanel;
