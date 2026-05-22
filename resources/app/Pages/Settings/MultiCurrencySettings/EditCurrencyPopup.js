import React from "react";
import {
  Popover,
  PopoverHeader,
  PopoverBody,
  Flex,
  Text,
  Input,
  Button,
  PopoverFooter,
  Label,
} from "../../../molecules";
import { __, sprintf } from "@/wpi18n";
import { InfoIcon } from "@/Icons";
import { CLASS_PREFIX } from "@/conf";

const EditCurrencyPopup = (props) => {
  const { editCurrency, setEditCurrency, handleUpdateData } = props;

  const handleClosePopup = () => {
    setEditCurrency(null);
  };
  return (
    <div>
      <Popover isOpen={editCurrency ? true : false} style={{ width: "442px" }}>
        <PopoverHeader borderBottom onClose={() => handleClosePopup()}>
          {__("Update Exchange Rates", "kirki-ecommerce")}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding: "var(--decom-spacing-5)",
            gap: "var(--decom-spacing-4)",
          }}
        >
          <Label
            className={`${CLASS_PREFIX}-edit-currency-rate-popup-label`}
            text={__("Enter rates per 1 USD", "kirki-ecommerce")} // TO-DO: set the value dynamically
            leftIcon={<InfoIcon />}
          />
          <Flex
            direction="column"
            gap={12}
            style={{
              maxHeight: "200px",
              overflowX: "scroll",
            }}
          >
            <Flex style={{ justifyContent: "space-between" }}>
              <Flex gap={12}>
                <Text
                  type="primary"
                  header={sprintf(__("%s", "kirki-ecommerce"), editCurrency?.icon)}
                />
                <Text
                  type="secondary"
                  header={sprintf(__("%s", "kirki-ecommerce"), editCurrency?.code)}
                />
                <Text
                  type="xsm"
                  header={sprintf(__("%s", "kirki-ecommerce"), editCurrency?.name)}
                />
              </Flex>
              <div style={{ width: "auto", margin: "var(--decom-spacing-f1)" }}>
                <Input
                  placeholder={__("0.730", "kirki-ecommerce")}
                  style={{ width: "auto" }}
                  value={editCurrency?.exchange_rate}
                  onChange={(value) =>
                    setEditCurrency({ ...editCurrency, exchange_rate: value })
                  }
                />
              </div>
            </Flex>
          </Flex>
        </PopoverBody>
        <PopoverFooter>
          <Button
            text={__("Cancel", "kirki-ecommerce")}
            size="small"
            type={"outlined"}
            onClick={() => {
              setEditCurrency(null);
            }}
          />
          <Button
            text={__("Update", "kirki-ecommerce")}
            size="small"
            type={"primary"}
            onClick={() => {
              handleUpdateData(editCurrency);
              setEditCurrency(null);
            }}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};

export default EditCurrencyPopup;
