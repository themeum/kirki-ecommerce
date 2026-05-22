import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  Checkbox,
  Flex,
  Card,
  Text,
} from "../../../../../molecules";
import SingleRow from "./SingleRow";
import { __ } from "@/wpi18n";
import { useDispatch } from "react-redux";
import BulkActionHandler from "../../../../../components/BulkActionHandler";
import useMarkList from "../../../../../hooks/useMarkList";
import VariantTableAction from "./VariantTableAction";
import { getSearchedValue, setUnsavedDataStatus } from "../../../utils";
import { useOutletContext } from "react-router";
import {
  bulkDeleteAttributeValueByIdAPI,
  setKeyValue,
} from "../../../../../store/attributesSlice";
import { dispatchToastMessage } from "../../../../utils";

const VariationTable = (props) => {
  const { results = [], tableHeaders, selectedItem, updateDataList } = props;
  const dispatch = useDispatch();
  const { confirmAction } = useOutletContext();
  const {
    handleSelectAll,
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
    handleClearSelection,
    isSelected,
    selectedItems,
    itemCount,
  } = useMarkList({ data: { results: results, total: results?.length } });
  const [searchValue, setSearchValue] = useState("");

  const filteredList = useMemo(() => {
    const keyword = searchValue?.trim();
    if (!keyword) return results;
    return getSearchedValue(keyword, results);
  }, [searchValue, results]);

  const handleApplyAction = (action) => {
    if (action === "delete") {
      setUnsavedDataStatus(true);
      confirmAction({
        action: () => onBulkDelete(),
        otherProps: {
          variant: "delete",
          force: true,
          title: __("Delete all variation?", "kirki-ecommerce"),
          subtitle: __(
            "Are you sure you want to delete all values? This action cannot be undone.",
            "kirki-ecommerce"
          ),
        },
      });
    }
  };

  const onBulkDelete = async () => {
    const attribute_id = selectedItem?.id;
    const result = await bulkDeleteAttributeValueByIdAPI({
      attribute_id,
      ids: selectedItems,
    });
    if (result?.success) {
      dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      dispatchToastMessage("success", {
        title: __("Attribute values deleted"),
      });
    }
  };

  return (
    <>
      {selectedItems.length > 0 ? (
        <BulkActionHandler
          optionsArray={[{ value: "delete", title: __("Delete", "kirki-ecommerce") }]}
          itemCount={itemCount}
          onSelectAll={handleSelectAll}
          onApply={(action) => handleApplyAction(action)}
        />
      ) : (
        <VariantTableAction
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          dataList={filteredList}
          updateDataList={updateDataList}
        />
      )}
      {!filteredList?.length ? (
        <Card
          type="innerDark"
          style={{ padding: "36px 0", borderRadius: "0px" }}
        >
          <Flex style={{ alignItems: "center", justifyContent: "center" }}>
            <Text
              type="primary"
              style={{ color: "#878593" }}
              header={__("No data found", "kirki-ecommerce")}
            />
          </Flex>
        </Card>
      ) : (
        <Table fixed>
          <TableHeader>
            <TableRow>
              <TableHead onlyCheckbox>
                <Checkbox
                  value={isSelected("*")}
                  onChange={handleAllCheckboxClick}
                />
              </TableHead>
              {tableHeaders?.map((header, index) => (
                <TableHead key={index}>{header?.title}</TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredList?.map((item, index) => {
              return (
                <SingleRow
                  key={index}
                  item={item}
                  selectedItem={selectedItem}
                  isSelected={isSelected}
                  handleSingleCheckboxClick={handleSingleCheckboxClick}
                />
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
};

export default VariationTable;
