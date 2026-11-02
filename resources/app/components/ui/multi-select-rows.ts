/**
 * Subpixel layout means two chips on the same row rarely report an identical
 * top, so tops within this many pixels count as one row.
 */
const ROW_TOLERANCE = 1;

/**
 * How many chips fit within a row cap, given each chip's top offset in
 * document order.
 *
 * Kept free of the DOM so it can be tested directly: jsdom reports every
 * `offsetTop` as 0, so a rendered component can never exercise this.
 *
 * @param tops Each chip's top offset, in the order the chips render.
 * @param maxRows How many rows of chips may show.
 *
 * @returns The number of leading chips that fall within the capped rows.
 * @since 1.0.0
 */
const countChipsWithinRows = (tops: number[], maxRows: number): number => {
  if (maxRows <= 0) {
    return 0;
  }

  let rows = 0;
  let rowTop = Number.NEGATIVE_INFINITY;
  let fitted = 0;

  for (const top of tops) {
    if (top > rowTop + ROW_TOLERANCE) {
      rows += 1;

      if (rows > maxRows) {
        break;
      }

      rowTop = top;
    }

    fitted += 1;
  }

  return fitted;
};

export { countChipsWithinRows };
