import { useCallback, useMemo, useState } from 'react';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable, { DataTableEmptyState } from '@/components/data-table';
import Button from '@/components/ui/button';
import {
  createReviewColumns,
  reviewBulkActions,
} from '@/features/reviews/components/review-table/columns';
import ReviewTableFilters from '@/features/reviews/components/review-table/review-table-filters';
import { ReviewDetailModal } from '@/features/reviews/components/review-detail-modal';
import type { Review, ReviewStatusType } from '@/features/reviews/schemas/review';
import {
  useBulkReviewActionMutation,
  useDeleteReviewMutation,
  useUpdateReviewStatusMutation,
} from '@/features/reviews/services/review';
import { reviewListOptions, type ReviewListFilter } from '@/features/reviews/types';
import { useConfirmDelete, useDataTableParams } from '@/hooks';
import type { ListingTableProps } from '@/types/pages/common';
import { __ } from '@/wpi18n';

const ReviewTable = ({ data, isLoading = false }: ListingTableProps<Review>) => {
  const {
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
    selectionResetKey,
    clearFilters,
  } = useDataTableParams<ReviewListFilter>(reviewListOptions);

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const updateStatusMutation = useUpdateReviewStatusMutation();
  const deleteMutation = useDeleteReviewMutation();
  const bulkActionMutation = useBulkReviewActionMutation();
  const { confirmDelete, confirmDeleteAsync, deleteConfirmation } = useConfirmDelete();

  const handleView = useCallback((review: Review) => {
    setSelectedReview(review);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedReview(null);
  }, []);

  const handleStatusChange = useCallback(
    (id: number, status: ReviewStatusType) => {
      void updateStatusMutation.mutateAsync({ id, status });
    },
    [updateStatusMutation],
  );

  const handleDelete = useCallback(
    (id: number) => {
      confirmDelete(
        {
          title: __('Delete review?', 'kirki-ecommerce'),
          description: __(
            'This review will be permanently deleted. This action cannot be undone.',
            'kirki-ecommerce',
          ),
        },
        () => {
          void deleteMutation.mutateAsync(id);
        },
      );
    },
    [confirmDelete, deleteMutation],
  );

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds }: DataTableSelectionState) => {
      const ids = selectedIds.map(Number);
      if (ids.length === 0) {
        return;
      }

      if (action === 'delete') {
        const confirmed = await confirmDeleteAsync({
          title: __('Delete selected reviews?', 'kirki-ecommerce'),
          description: __(
            'The selected reviews will be permanently deleted. This action cannot be undone.',
            'kirki-ecommerce',
          ),
        });

        if (!confirmed) {
          throw new Error('Bulk delete cancelled');
        }

        await bulkActionMutation.mutateAsync({ action: 'delete', ids });
        return;
      }

      if (action === 'approve' || action === 'reject') {
        await bulkActionMutation.mutateAsync({ action, ids });
      }
    },
    [bulkActionMutation, confirmDeleteAsync],
  );

  const columns = useMemo(
    () =>
      createReviewColumns({
        onView: handleView,
        onStatusChange: handleStatusChange,
        onDelete: handleDelete,
      }),
    [handleView, handleStatusChange, handleDelete],
  );

  return (
    <>
      <DataTable
        tableId="reviews"
        data={data?.results ?? []}
        columns={columns}
        total={data?.total}
        pageCount={data?.last_page ?? 0}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        isLoading={isLoading}
        enableRowSelection
        selectionResetKey={selectionResetKey}
        bulkActions={reviewBulkActions}
        onBulkApply={handleBulkApply}
        columnPinning={{ right: ['actions'] }}
        toolbar={<ReviewTableFilters />}
        emptyState={
          <DataTableEmptyState
            title={__('No reviews found', 'kirki-ecommerce')}
            actions={
              <Button variant="secondary" onClick={clearFilters}>
                {__('Clear Filters', 'kirki-ecommerce')}
              </Button>
            }
          />
        }
      />
      {deleteConfirmation}
      <ReviewDetailModal
        review={selectedReview}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </>
  );
};

ReviewTable.displayName = 'ReviewTable';

export default ReviewTable;
