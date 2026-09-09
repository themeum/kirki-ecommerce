import type { CSSObject } from '@emotion/react';
import type { ColumnDef } from '@tanstack/react-table';
import { SquareArrowOutUpRight } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import DataTable from '@/components/data-table';
import Flex from '@/components/ui/flex';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Text from '@/components/ui/text';
import { AdvanceSettingsFormSchema } from '@/features/settings/advanced/schemas/forms/page-settings';
import { usePagesQuery } from '@/features/settings/advanced/services/page-settings';
import type { AdvanceSettingsPage } from '@/schemas/catalog/settings';
import { useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { isDefined } from '@/utils/object';
import { __, sprintf } from '@/wpi18n';

const statusBarCss = (isActive: boolean): CSSObject => ({
  width: '2px',
  height: '14px',
  borderRadius: '2px',
  backgroundColor: isActive ? theme.colors.icon.success : theme.colors.icon.critical,
});

const StatusCell = ({ status }: { status: AdvanceSettingsPage['status'] }) => {
  const isActive = status === 'active';

  const getLabel = (status: AdvanceSettingsPage['status']) => {
    switch (status) {
      case 'active':
        return __('Active', 'kirki-ecommerce');
      case 'inactive':
        return __('Inactive', 'kirki-ecommerce');
      case 'not-found':
        return __('Not found', 'kirki-ecommerce');
    }
  };

  return (
    <Flex align="center" gap="2">
      <span css={scoped(statusBarCss(isActive))} />
      <Text variant="tiny" color={isActive ? 'success' : 'critical'}>
        {getLabel(status)}
      </Text>
    </Flex>
  );
};

StatusCell.displayName = 'StatusCell';

type PageTableProps = {
  pages: AdvanceSettingsPage[];
};

type PageRow = Omit<AdvanceSettingsPage, 'id'> & {
  id: AdvanceSettingsPage['key'];
  pageId: AdvanceSettingsPage['id'];
};

const PageTable = ({ pages }: PageTableProps) => {
  const { data: allPages } = usePagesQuery({ status: 'publish' });
  const { mutate: savePages } = useUpdateSettingsMutation<'advance'>();
  const data = useMemo<PageRow[]>(
    () => pages.map(({ id, ...page }) => ({ ...page, id: page.key, pageId: id })),
    [pages],
  );

  const handlePageChange = useCallback(
    (pageKey: AdvanceSettingsPage['key'], pageId: number) => {
      const payload = AdvanceSettingsFormSchema.parse({
        pages: pages.map((page) => (page.key === pageKey ? { ...page, id: pageId } : page)),
      });

      savePages({ key: 'advance', data: payload });
    },
    [pages, savePages],
  );

  const columns = useMemo<ColumnDef<PageRow>[]>(
    () => [
      {
        id: 'id',
        header: __('Id', 'kirki-ecommerce'),
        enableSorting: false,
        cell: ({ row }) => (
          <Text variant="tiny" color="secondary">
            {sprintf('#%s', row.original.pageId ?? '')}
          </Text>
        ),
      },
      {
        id: 'name',
        header: __('Title', 'kirki-ecommerce'),
        enableSorting: false,
        meta: { cssOverride: styles.titleColumn },
        cell: ({ row }) =>
          isDefined(row.original.url) && isDefined(row.original.slug) ? (
            <>
              <span data-hover-hide>
                <Text variant="tiny" cssOverride={styles.truncate}>
                  {row.original.name}
                </Text>
              </span>
              <a
                data-hover-show
                href={row.original.url}
                target="_blank"
                rel="noreferrer"
                css={scoped(styles.slugLink)}
              >
                <span css={scoped(styles.truncate)}>{`/${row.original.slug}`}</span>
                <SquareArrowOutUpRight size={12} />
              </a>
            </>
          ) : (
            <Text variant="tiny" cssOverride={styles.truncate}>
              {row.original.name}
            </Text>
          ),
      },
      {
        id: 'title',
        header: __('Page', 'kirki-ecommerce'),
        enableSorting: false,
        meta: { cssOverride: styles.pageColumn },
        cell: ({ row }) => (
          <>
            <span data-hover-hide>
              <Text variant="tiny" cssOverride={styles.truncate}>
                {row.original.title}
              </Text>
            </span>
            <span data-hover-show>
              <Select
                defaultValue={String(row.original.pageId)}
                onValueChange={(value) => handlePageChange(row.original.id, Number(value))}
              >
                <SelectTrigger cssOverride={styles.selectTrigger}>
                  <SelectValue>
                    <Text variant="tiny" cssOverride={styles.truncate}>
                      {isDefined(row.original.pageId)
                        ? row.original.title
                        : __('Select page', 'kirki-ecommerce')}
                    </Text>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allPages?.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
          </>
        ),
      },
      {
        id: 'status',
        header: __('Status', 'kirki-ecommerce'),
        enableSorting: false,
        cell: ({ row }) => <StatusCell status={row.original.status} />,
        meta: { cssOverride: styles.statusColumn },
      },
    ],
    [allPages, handlePageChange],
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      pageCount={1}
      fixed
      hidePagination
      pagination={{ pageIndex: 0, pageSize: 1 }}
      onPaginationChange={noop}
      sorting={[]}
      onSortingChange={noop}
      cssOverride={styles.tableCss}
    />
  );
};

PageTable.displayName = 'PageTable';

export default PageTable;

const styles = defineStyles({
  tableCss: {
    '& thead th': { height: '40px' },
    '& tbody td': { height: '56px' },
    '& [data-hover-show]': { display: 'none' },
    '& tbody tr:hover [data-hover-show], & [data-hover-show]:focus-within': { display: 'flex' },
    '& tbody tr:hover [data-hover-hide], & [data-hover-show]:focus-within': { display: 'none' },
  },
  truncate: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  slugLink: {
    display: 'none',
    alignItems: 'center',
    gap: theme.spacing[1],
    minWidth: 0,
    color: theme.colors.text.primary,
    textDecoration: 'none',
    '& svg': {
      flexShrink: 0,
    },
  },
  titleColumn: {
    maxWidth: '200px',
  },
  pageColumn: {
    maxWidth: '180px',
  },
  statusColumn: {
    maxWidth: '142px',
  },
  selectTrigger: {
    height: '32px',
  },
});
