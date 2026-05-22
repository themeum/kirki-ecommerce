import React from "react";
import { Button, Card, Container, Flex, PageHeading } from "@/molecules";
import { useDispatch, useSelector } from "react-redux";
import { useGetListAPI } from "@/hooks";
import { Pagination } from "@/components";
import { __ } from "@/wpi18n";
import InventoryTable from "./InventoryTable";
import { getInventoryAPI, setKeyValue } from "../../store/inventorySlice";
import { updateBulkVariantAPI } from "../../store/BulkEditSlice";

const Inventory = () => {
  const dispatch = useDispatch();
  const { loaded, hasChanges, data } = useSelector((state) => state.inventory);
  useGetListAPI({ reducerName: "inventory", apiCallBack: getInventoryAPI });
  const handlePaginationChange = (value) => {
    dispatch(setKeyValue({ key: "page", value: value }));
  };

  const handleInventoryUpdate = async () => {
    const { results } = data;
    const res = await updateBulkVariantAPI({
      variants: Object.values(results),
    });
    if (res.success) {
      dispatch(setKeyValue({ key: "hasChanges", value: false }));
    }
  };

  const discardInventoryUpdate = () => {
    dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
    dispatch(setKeyValue({ key: "hasChanges", value: false }));
  };

  return (
    <>
      <PageHeading
        text={
          hasChanges ? __("Save changes?", "kirki-ecommerce") : __("Inventory", "kirki-ecommerce")
        }
        actions={
          hasChanges ? (
            <>
              <Button
                type="ghost"
                text={__("Discard", "kirki-ecommerce")}
                size="small"
                onClick={discardInventoryUpdate}
              />
              <Button
                type="primary"
                text={__("Save", "kirki-ecommerce")}
                size="small"
                onClick={handleInventoryUpdate}
              />
            </>
          ) : (
            <>
              <Button type="ghost" text={__("Import", "kirki-ecommerce")} size="small" />
              <Button type="ghost" text={__("Export", "kirki-ecommerce")} size="small" />
            </>
          )
        }
      />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <InventoryTable />
            </Card>
            <Pagination
              data={data}
              onChange={(page) => handlePaginationChange(page)}
            />
          </Flex>
        ) : (
          <div>{__("Loading...", "kirki-ecommerce")}</div>
        )}
      </Container>
    </>
  );
};

export default Inventory;
