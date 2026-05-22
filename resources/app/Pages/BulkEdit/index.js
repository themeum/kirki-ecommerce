import React from "react";
import { Badge, Button, FullPageContainer, PageHeading } from "@/molecules";
import { useDispatch, useSelector } from "react-redux";
import { DropdownButton } from "@/components";
import { __ } from "@/wpi18n";
import { useSearchParams } from "react-router";
import BulkEditTable from "./BulkEditTable";
import { useEffect } from "react";
import { LayoutIcon } from "@/Icons";
import { useState } from "react";
import {
  getVariantsListByIdAPI,
  setKeyValue,
  updateBulkVariantAPI,
} from "../../store/BulkEditSlice";
import { allTableHeaders } from "./utils";

const BulkEdit = () => {
  const dispatch = useDispatch();
  const { loaded, data } = useSelector((state) => state.bulk);
  const [selectedFields, setSelectedFields] = useState(
    allTableHeaders.map((item) => item.value),
  );
  const [searchParams] = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").map(Number);

  useEffect(() => {
    dispatch(
      getVariantsListByIdAPI(ids, {
        search: "",
        sort_by: "id",
        sort_order: "asc",
        page: 1,
      }),
    );
  }, []);

  const handleProductBulkSave = async () => {
    if (loaded) {
      const { variants } = data;
      const formattedData = variants.map((item) => ({
        ...item,
        media: Number(item.media?.id),
      }));
      const result = await updateBulkVariantAPI({ variants: formattedData });
      if (result.success) {
        console.log(result);
        dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      }
    }
  };

  return (
    <>
      <PageHeading
        text={__("Bulk Edit", "kirki-ecommerce")}
        style={{
          padding: "16px 12px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #f3f3f7",
          columnGap: "8px",
        }}
        size="fullWidth"
        hasBack
        noMargin
        buttonProps={{
          type: "outlined",
          size: "small",
        }}
        actions={
          <>
            <DropdownButton
              buttonProps={{
                type: "outlined",
                icon: <LayoutIcon />,
              }}
              options={allTableHeaders}
              value={selectedFields}
              hasLeftIcon
              checkboxField
              multiple
              dropdownStyle={{ minWidth: "288px" }}
              onOptionSelect={(value) => setSelectedFields(value)}
            />
            <Button
              text={__("Cancel", "kirki-ecommerce")}
              type="secondary"
              onClick={() => window.history.back()}
              size="small"
            />
            <Button
              text={__("Save", "kirki-ecommerce")}
              type="primary"
              onClick={handleProductBulkSave}
              size="small"
            />
          </>
        }
      >
        <Badge type="secondary" text={__("Unsaved Changes", "kirki-ecommerce")} />
      </PageHeading>

      <FullPageContainer scrollable>
        {loaded ? (
          <BulkEditTable selectedFields={selectedFields} />
        ) : (
          <div>{__("Loading...", "kirki-ecommerce")}</div>
        )}
      </FullPageContainer>
    </>
  );
};

export default BulkEdit;
