const ELLIPSIS = 'ellipsis';

const getPageItems = (current_page: number, last_page: number, siblingCount = 1): (number | typeof ELLIPSIS)[] => {
  const totalPageNumbers = siblingCount * 2 + 5;

  if (totalPageNumbers >= last_page) {
    return Array.from({ length: last_page }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(current_page - siblingCount, 1);
  const rightSiblingIndex = Math.min(current_page + siblingCount, last_page);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < last_page - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRangeLength = 3 + siblingCount * 2;
    const leftRange = Array.from({ length: leftRangeLength }, (_, i) => i + 1);

    return [...leftRange, ELLIPSIS, last_page];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRangeLength = 3 + siblingCount * 2;
    const rightRange = Array.from(
      { length: rightRangeLength },
      (_, i) => last_page - rightRangeLength + i + 1,
    );

    return [1, ELLIPSIS, ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i,
  );

  return [1, ELLIPSIS, ...middleRange, ELLIPSIS, last_page];
};

export { ELLIPSIS, getPageItems };
