import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import FilterPopup from '@/features/customers/components/customer-table/filter-popup/filter-popup';
import type { CustomerListFilter } from '@/features/customers/types';
import { customerListOptions } from '@/features/customers/types';
import { useDataTableParams } from '@/hooks';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const CustomerTableFilters = () => {
  const { params, setParam } = useDataTableParams<CustomerListFilter>(customerListOptions);

  const handleSearchChange = (value: string) => {
    setParam('search', value);
  };

  return (
    <Flex cssOverride={styles.wrapper}>
      <div style={{ width: '180px' }}>
        <Searchbox
          value={params.search || ''}
          onChange={(value) => handleSearchChange(String(value))}
          clearable
        />
      </div>
      <ActionGroup>
        <FilterPopup />
      </ActionGroup>
    </Flex>
  );
};

CustomerTableFilters.displayName = 'CustomerTableFilters';

export default CustomerTableFilters;

const styles = defineStyles({
  wrapper: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
  selectTrigger: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  },
});
