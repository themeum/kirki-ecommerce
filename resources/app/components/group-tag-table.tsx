import { useEffect, useState, type ReactNode } from 'react';

import GroupSelect from '@/components/group-select';
import Button from '@/components/ui/button';
import { MinusIcon } from '@/icons';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Chip from '@/components/ui/chip';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { scoped } from '@/theme/mixins';
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

const styles = {
  shell: scoped({
    overflow: 'hidden',
  }),
  hoverParent: scoped({
    '&:hover [data-hover-reveal]': {
      visibility: 'visible',
    },
  }),
  hoverReveal: scoped({
    visibility: 'hidden',
  }),
  cardAllRounded: scoped({
    borderRadius: theme.radius.lg,
  }),
  cardBottomRounded: scoped({
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
  }),
};

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
    <div css={styles.shell}>
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
          css={[
            cardStyles.innerCard,
            hasSelect ? styles.cardBottomRounded : styles.cardAllRounded,
          ]}
          style={{
            borderColor: '#E6E6E6',
          }}
        >
          <CardContent css={cardStyles.innerContent}>
          <Flex gap={8} direction="column">
            {(Object.keys(groupedValueData) || []).map((groupName, index) => (
              <div key={index} css={styles.hoverParent}>
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
                        data-hover-reveal="true"
                        css={styles.hoverReveal}
                        onClick={() => handleClearSingleGroup(groupName)}
                      >
                        {__('Clear all', 'kirki-ecommerce')}
                      </Button>
                    )}
                    {groupedValueData[groupName].map((tagName, innerIndex) => (
                      <Chip
                        text={String(tagName)}
                        key={innerIndex}
                        closeIcon={
                          isEditable &&
                          !requiredFields[groupName]?.includes(tagName) ? (
                            <MinusIcon />
                          ) : null
                        }
                        onRemove={() =>
                          handleDeleteSingleTag(tagName, groupName)
                        }
                      />
                    ))}
                  </Flex>
                </Flex>
              </div>
            ))}
          </Flex>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default GroupTagTable;
