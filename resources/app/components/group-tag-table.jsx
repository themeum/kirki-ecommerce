import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Tag from '@/molecules/tag';
import Text from '@/molecules/text';
import React, { useEffect, useState } from "react";
import { MinusIcon } from "@/icons";
import GroupSelect from '@/components/group-select';
import { CLASS_PREFIX } from "@/conf";
import { __ } from "@/wpi18n";

const GroupTagTable = (props) => {
  const {
    selectedValues,
    groupDetails = {},
    requiredFields = [],
    onChange = () => {},
    optionsArray = [],
    placeholder = "",
    hasSelect,
    isEditable,
  } = props;

  const [groupedValueData, setGroupedValueData] = useState(selectedValues);

  useEffect(() => {
    setGroupedValueData(selectedValues);
  }, [selectedValues]);

  const handleSelectionChange = (valueArray) => {
    setGroupedValueData(valueArray);
    onChange(valueArray);
  };
  const handleDeleteSingleTag = (tagName, groupName) => {
    const filteredArray = groupedValueData[groupName].filter(
      (tag) => tag !== tagName,
    );
    clearSelectedData(filteredArray, groupName);
  };

  const clearSelectedData = (filteredArray, groupName) => {
    if (filteredArray.length > 0) {
      onChange({ ...groupedValueData, [groupName]: filteredArray });
      setGroupedValueData((prev) => ({
        ...prev,
        [groupName]: filteredArray,
      }));
    } else {
      const fullData = { ...groupedValueData };
      delete fullData[groupName];
      setGroupedValueData(fullData);
      onChange(fullData);
    }
  };

  const handleClearSingleGroup = (groupName) => {
    const filteredArray = groupedValueData[groupName].filter((item) =>
      requiredFields[groupName]?.includes(item),
    );
    clearSelectedData(filteredArray, groupName);
  };

  return (
    <div className={`${CLASS_PREFIX}-tag-manager`}>
      {hasSelect && (
        <GroupSelect
          placeholder={placeholder}
          valueArray={groupedValueData}
          optionsArray={optionsArray}
          checkboxField
          onChange={(value) => handleSelectionChange(value)}
          dropdownFooter
        />
      )}
      {Object.keys(groupedValueData).length ? (
        <Card
          type="inner"
          style={{
            borderColor: "#E6E6E6",
            borderRadius: hasSelect ? "0 0 8px 8px" : "8px",
          }}
        >
          <Flex gap={8} direction="column">
            {(Object.keys(groupedValueData) || []).map((groupName, index) => (
              <div key={index}>
                <Flex
                  key={index}
                  style={{
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  className={`${CLASS_PREFIX}-hover-parent`}
                >
                  <Text
                    gap={4}
                    type="xsm"
                    leftIcon={groupDetails[groupName]?.icon}
                    subHeader={groupDetails[groupName]?.title}
                    style={{ color: "#878593" }}
                  />
                  <Flex
                    gap={8}
                    style={{
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {isEditable && (
                      <Button
                        text={__("Clear all", "kirki-ecommerce")}
                        type="blank"
                        size="small"
                        className={`${CLASS_PREFIX}-hover-visible`}
                        onClick={() => handleClearSingleGroup(groupName)}
                      />
                    )}
                    {groupedValueData[groupName].map((tagName, innerIndex) => (
                      <Tag
                        text={tagName}
                        key={innerIndex}
                        closeIcon={
                          isEditable &&
                          !requiredFields[groupName]?.includes(tagName) ? (
                            <MinusIcon />
                          ) : null
                        }
                        onTagRemove={() =>
                          handleDeleteSingleTag(tagName, groupName)
                        }
                      />
                    ))}
                  </Flex>
                </Flex>
              </div>
            ))}
          </Flex>
        </Card>
      ) : null}
    </div>
  );
};

export default GroupTagTable;
