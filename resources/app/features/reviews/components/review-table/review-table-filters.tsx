import { memo } from 'react';

import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reviewListOptions, type ReviewListFilter } from '@/features/reviews/types';
import { useDataTableParams } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const ReviewTableFilters = memo(() => {
  const { params, setParam } = useDataTableParams<ReviewListFilter>(reviewListOptions);

  const handleSearchChange = (value: string) => {
    setParam('search', value);
  };

  const handleStatusChange = (status: string) => {
    setParam('status', status === 'all' ? '' : status);
  };

  const currentStatus = params.status || 'all';

  return (
    <Flex cssOverride={styles.wrapper} gap={3} align="center">
      <div style={{ width: '240px' }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value as string)}
          value={params.search || ''}
          placeholder={__('Search reviews...', 'kirki-ecommerce')}
          delay={500}
          clearable
        />
      </div>

      <div style={{ width: '160px' }}>
        <Select
          value={currentStatus}
          onValueChange={(val) => handleStatusChange(String(val))}
        >
          <SelectTrigger>
            <SelectValue placeholder={__('All Statuses', 'kirki-ecommerce')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{__('All Statuses', 'kirki-ecommerce')}</SelectItem>
            <SelectItem value="pending">{__('Pending', 'kirki-ecommerce')}</SelectItem>
            <SelectItem value="approved">{__('Approved', 'kirki-ecommerce')}</SelectItem>
            <SelectItem value="rejected">{__('Rejected', 'kirki-ecommerce')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Flex>
  );
});

ReviewTableFilters.displayName = 'ReviewTableFilters';

export default ReviewTableFilters;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
});
