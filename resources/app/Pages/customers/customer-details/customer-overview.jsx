import { FileTextIcon } from "@/icons";
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';

import Text from '@/molecules/text';
import React from "react";
import { __ } from "@/wpi18n";
import { Select } from '@/molecules/select';

const languageArray = [
  { value: "english", title: "English (Default)" },
  { value: "bengali", title: "Bengali" },
  { value: "spanish", title: "Spanish" },
];
const CustomerOverview = ({ customerFormData, errors, handleOnChange }) => {
  return (
    <Card
      type="form"
      style={{ padding: "20px", borderRadius: "20px", gap: "20px" }}
    >
      <Text
        header={__("Basic Info", "kirki-ecommerce")}
        type="primary"
        leftIcon={<FileTextIcon />}
      />
      <Card type="inner" style={{ padding: "16px" }}>
        <Flex direction="column" gap={16}>
          <Input
            label={__("First Name", "kirki-ecommerce")}
            value={customerFormData?.first_name}
            placeholder={__("e.g. John", "kirki-ecommerce")}
            onChange={(value) => handleOnChange(value, "first_name")}
            error={errors?.first_name}
          />
          <Input
            label={__("Last Name", "kirki-ecommerce")}
            value={customerFormData?.last_name}
            placeholder={__("e.g. Musk", "kirki-ecommerce")}
            onChange={(value) => handleOnChange(value, "last_name")}
            error={errors?.last_name}
          />
          <Select
            label={__("Language", "kirki-ecommerce")}
            value={customerFormData?.language}
            optionsArray={languageArray}
            defaultValue="english"
            onChange={(value) => handleOnChange(value, "language")}
            error={errors?.language}
          />
          <Input
            label={__("Email", "kirki-ecommerce")}
            value={customerFormData?.email}
            placeholder={__("example@yourmail.com", "kirki-ecommerce")}
            onChange={(value) => handleOnChange(value, "email")}
            error={errors?.email}
          />
          <Input
            label={__("Phone Number", "kirki-ecommerce")}
            value={customerFormData?.phone}
            placeholder={__("+1 (555) 222 4354", "kirki-ecommerce")}
            type="tel"
            onChange={(value) => handleOnChange(value, "phone")}
            error={errors?.phone}
          />
          <Checkbox
            label={__("Customer agrees to receive marketing emails", "kirki-ecommerce")}
            value={customerFormData?.accepts_marketing}
            onChange={(value) => handleOnChange(value, "accepts_marketing")}
            error={errors?.accepts_marketing}
          />
        </Flex>
      </Card>
    </Card>
  );
};

export default CustomerOverview;
