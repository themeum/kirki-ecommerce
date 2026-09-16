import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { CloseIcon, ListFilter } from '@/icons';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

type DataTableFilterPopoverProps = {
  appliedCount: number;
  onApply: () => void;
  onClear: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  children: ReactNode;
  contentCssOverride?: CSSObject;
};

const DataTableFilterPopover = (props: DataTableFilterPopoverProps) => {
  const { appliedCount, onApply, onClear, onOpen, onClose, children, contentCssOverride } = props;
  const [isOpen, setIsOpen] = useState(false);

  const hasFilters = appliedCount > 0;

  const close = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsOpen(true);
      onOpen?.();
      return;
    }

    close();
  };

  const handleApply = () => {
    onApply();
    close();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <Flex>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            cssOverride={mergeCss(hasFilters ? styles.triggerGrouped : undefined)}
          >
            <ListFilter />
            {hasFilters
              ? sprintf(
                  /* translators: %d: number of filters currently applied */
                  _n('%d Filter', '%d Filters', appliedCount, 'kirki-ecommerce'),
                  appliedCount,
                )
              : __('Filter', 'kirki-ecommerce')}
          </Button>
        </DropdownMenuTrigger>
        {hasFilters && (
          <Button
            variant="outline"
            size="icon"
            aria-label={__('Clear all filters', 'kirki-ecommerce')}
            title={__('Clear all filters', 'kirki-ecommerce')}
            cssOverride={styles.clearButton}
            onClick={onClear}
          >
            <CloseIcon />
          </Button>
        )}
      </Flex>
      <DropdownMenuContent cssOverride={mergeCss(styles.content, contentCssOverride)}>
        <Flex cssOverride={styles.header}>
          <Text>{__('Filter', 'kirki-ecommerce')}</Text>
          <ActionGroup>
            <Button variant="ghost" size="icon" onClick={close} cssOverride={styles.closeButton}>
              <CloseIcon />
            </Button>
          </ActionGroup>
        </Flex>

        <Flex direction="column" gap={4} cssOverride={styles.body}>
          {children}
        </Flex>

        <Flex cssOverride={styles.footer} justify="space-between">
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
              size="sm"
              cssOverride={{ color: theme.colors.text.critical }}
            >
              {__('Clear all', 'kirki-ecommerce')}
            </Button>
          )}
          <Button variant="primary" onClick={handleApply} size="sm">
            {__('Apply Filter', 'kirki-ecommerce')}
          </Button>
        </Flex>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

DataTableFilterPopover.displayName = 'DataTableFilterPopover';

export default DataTableFilterPopover;
export type { DataTableFilterPopoverProps };

const styles = defineStyles({
  triggerGrouped: {
    color: theme.colors.text.emphasis,
    borderRight: 'none',
    borderRadius: `${theme.radius.md} ${theme.radius.none} ${theme.radius.none} ${theme.radius.md}`,
    '&:hover': {
      color: theme.colors.text.emphasis,
    },
  },
  clearButton: {
    color: theme.colors.text.emphasis,
    borderRadius: `${theme.radius.none} ${theme.radius.md} ${theme.radius.md} ${theme.radius.none}`,
  },
  content: {
    width: '288px',
    maxHeight: '522px',
  },
  header: {
    top: '-4px',
    position: 'sticky',
    backgroundColor: theme.colors.background.surface,
    padding: `${theme.spacing[3]} ${theme.spacing[3]} ${theme.spacing[2]} ${theme.spacing[3]}`,
    zIndex: theme.zIndex.sticky,
  },
  body: {
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    overflowY: 'auto',
  },
  closeButton: {
    color: theme.colors.text.primary,
  },
  footer: {
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    paddingTop: theme.spacing[3],
    borderTop: `1px solid ${theme.colors.border.default}`,
    bottom: '-4px',
    position: 'sticky',
    backgroundColor: theme.colors.background.surface,
  },
});
