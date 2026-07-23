import { css } from '@emotion/react';
import { useEffect, useState, type ReactNode } from 'react';

import GroupSelect from '@/components/group-select';
import Button from '@/components/ui/button';
import { CLASS_PREFIX } from '@/conf';
import { MinusIcon } from '@/icons';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Tag from '@/components/ui/tag';
import Text from '@/components/ui/text';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

type GroupedValues = Record<string, Array<string | number>>;

type GroupDetails = Record<
  string,
  {
    icon?: ReactNode;
    title?: string;
  }
>;

type GroupTagTableProps = {
  selectedValues: GroupedValues;
  groupDetails?: GroupDetails;
  requiredFields?: Record<string, Array<string | number>>;
  onChange?: (values: GroupedValues) => void;
  optionsArray?: SelectOption[];
  placeholder?: string;
  hasSelect?: boolean;
  isEditable?: boolean;
};

const clearAllButtonCss = css({
  visibility: 'hidden',
  [`.${CLASS_PREFIX}-hover-parent:hover &`]: {
    visibility: 'visible',
  },
});

const GroupTagTable = (props: GroupTagTableProps) => {
  const {
    selectedValues,
    groupDetails = {},
    requiredFields = {},
    onChange = () => {},
    optionsArray = [],
    placeholder = '',
    hasSelect,
    isEditable,
  } = props;

  const [groupedValueData, setGroupedValueData] =
    useState<GroupedValues>(selectedValues);

  useEffect(() => {
    setGroupedValueData(selectedValues);
  }, [selectedValues]);

  const handleSelectionChange = (valueArray: GroupedValues) => {
    setGroupedValueData(valueArray);
    onChange(valueArray);
  };
  const handleDeleteSingleTag = (tagName: string | number, groupName: string) => {
    const filteredArray = groupedValueData[groupName].filter(
      (tag) => tag !== tagName,
    );
    clearSelectedData(filteredArray, groupName);
  };

  const clearSelectedData = (
    filteredArray: Array<string | number>,
    groupName: string,
  ) => {
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

  const handleClearSingleGroup = (groupName: string) => {
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
            borderColor: '#E6E6E6',
            borderRadius: hasSelect ? '0 0 8px 8px' : '8px',
          }}
        >
          <Flex gap={8} direction="column">
            {(Object.keys(groupedValueData) || []).map((groupName, index) => (
              <div key={index} className={`${CLASS_PREFIX}-hover-parent`}>
                <Flex
                  key={index}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    gap={4}
                    type="xsm"
                    leftIcon={groupDetails[groupName]?.icon}
                    subHeader={groupDetails[groupName]?.title}
                    style={{ color: '#878593' }}
                  />
                  <Flex
                    gap={8}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {isEditable && (
                      <Button
                        variant="link"
                        size="sm"
                        css={clearAllButtonCss}
                        onClick={() => handleClearSingleGroup(groupName)}
                      >
                        {__('Clear all', 'kirki-ecommerce')}
                      </Button>
                    )}
                    {groupedValueData[groupName].map((tagName, innerIndex) => (
                      <Tag
                        text={String(tagName)}
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
