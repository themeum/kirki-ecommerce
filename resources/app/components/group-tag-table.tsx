import { type ReactNode, useEffect, useState } from 'react';

import GroupSelect from '@/components/group-select';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Chip from '@/components/ui/chip';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { MinusIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import type { SelectOption } from '@/types/components/common';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type GroupedValues = Record<string, (string | number)[]>;

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
  requiredFields?: Record<string, (string | number)[]>;
  onChange?: (values: GroupedValues) => void;
  optionsArray?: SelectOption[];
  placeholder?: string;
  hasSelect?: boolean;
  isEditable?: boolean;
};

const styles = defineStyles({
  shell: {
    overflow: 'hidden',
  },
  hoverParent: {
    '&:hover [data-hover-reveal]': {
      visibility: 'visible',
    },
  },
  hoverReveal: {
    visibility: 'hidden',
  },
  cardAllRounded: {
    borderRadius: theme.radius.lg,
  },
  cardBottomRounded: {
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
  },
  cardBorder: {
    borderColor: theme.colors.border.alt,
  },
  mutedText: {
    color: theme.colors.text.subdued,
  },
});

const GroupTagTable = (props: GroupTagTableProps) => {
  const {
    selectedValues,
    groupDetails = {},
    requiredFields = {},
    onChange = noop,
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
    filteredArray: (string | number)[],
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

  const hasSelectedValues = Object.keys(groupedValueData).length > 0;

  return (
    <div css={scoped(styles.shell)}>
      {hasSelect && (
        <GroupSelect
          placeholder={placeholder}
          valueArray={groupedValueData}
          optionsArray={optionsArray}
          checkboxField
          onChange={(value) => handleSelectionChange(value)}
          dropdownFooter
          isAttached={hasSelectedValues}
        />
      )}
      {hasSelectedValues ? (
        <Card
          cssOverride={mergeCss(cardStyles.innerCard,
            hasSelect ? styles.cardBottomRounded : styles.cardAllRounded,
            styles.cardBorder)}
        >
          <CardContent cssOverride={cardStyles.innerContent}>
            <Flex gap={2} direction="column">
              {(Object.keys(groupedValueData) || []).map((groupName, index) => (
                <div key={index} css={scoped(styles.hoverParent)}>
                  <Flex
                    key={index}
                    align="center" justify="space-between">
                    <Flex gap={2} align="center">
                      {groupDetails[groupName]?.icon}
                      <Text
                        variant="small"
                        color="subdued"
                        cssOverride={styles.mutedText}
                      >
                        {groupDetails[groupName]?.title}
                      </Text>
                    </Flex>
                    <Flex
                      gap={2}
                      align="center" justify="space-between">
                      {isEditable && (
                        <Button
                          variant="link"
                          data-hover-reveal="true"
                          size="xs"
                          cssOverride={styles.hoverReveal}
                          onClick={() => handleClearSingleGroup(groupName)}
                        >
                          {__('Clear All', 'kirki-ecommerce')}
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
