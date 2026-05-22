import { __ } from "@/wpi18n";
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import { EyeClosedIcon, EyeIcon } from "@/icons";

export const getFormField = (
  field,
  handleOnChange,
  index,
  handleRightAction,
  inputFieldType,
  gatewayConfObj,
  errors
) => {
  const inputValue = gatewayConfObj?.[field?.name] ?? "";
  const isSecret = field?.name.includes("secret");

  if (field?.type === "text") {
    return (
      <Flex gap={8} style={{ alignItems: "center" }}>
        <Input
          label={field?.label}
          onChange={(value) => handleOnChange(value, field?.name)}
          placeholder={__("Type here", "kirki-ecommerce")}
          type={inputFieldType}
          rightIcon={
            isSecret ? (
              inputFieldType === "password" ? (
                <EyeClosedIcon />
              ) : (
                <EyeIcon />
              )
            ) : undefined
          }
          handleRightAction={
            isSecret ? () => handleRightAction(index) : undefined
          }
          value={inputValue}
          error={errors[field?.name]}
        />
      </Flex>
    );
  }
};
