import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

type DataTableSlotProps = {
  children: ReactNode;
};

const DataTableAction = ({ children }: DataTableSlotProps) => children;

DataTableAction.displayName = 'DataTableAction';

const DataTableFilterAction = ({ children }: DataTableSlotProps) => children;

DataTableFilterAction.displayName = 'DataTableFilterAction';

/*
 * A pass-through slot: whether there is anything to show is the filter bar's
 * own business, so the table no longer has to read the URL to decide.
 */
const DataTableFilterBar = ({ children }: DataTableSlotProps) => children;

DataTableFilterBar.displayName = 'DataTableFilterBar';

const findSlot = (children: ReactNode, type: unknown) => {
  let match: ReactElement | undefined;

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === type) {
      match = child;
    }
  });

  return match;
};

export {
  DataTableAction,
  DataTableFilterAction,
  DataTableFilterBar,
  findSlot,
};
