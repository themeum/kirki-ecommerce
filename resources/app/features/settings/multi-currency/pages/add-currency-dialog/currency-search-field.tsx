import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { useAddCurrencyDialogContext } from '@/features/settings/multi-currency/contexts/add-currency-dialog-context';
import { SearchIcon } from '@/icons';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const CurrencySearchField = () => {
  const { searchValue, handleSearchCurrency } = useAddCurrencyDialogContext();

  return (
    <Flex direction="column" gap={2}>
      <Label htmlFor="add-currency-search">{__('Search currency', 'kirki-ecommerce')}</Label>
      <div style={{ position: 'relative' }}>
        <span css={scoped(styles.searchIcon)}>
          <SearchIcon />
        </span>
        <Input
          id="add-currency-search"
          type="search"
          value={searchValue}
          placeholder={__('Search', 'kirki-ecommerce')}
          onChange={handleSearchCurrency}
          cssOverride={styles.searchInput}
        />
      </div>
    </Flex>
  );
};

CurrencySearchField.displayName = 'CurrencySearchField';

export default CurrencySearchField;

const styles = defineStyles({
  searchInput: {
    paddingLeft: theme.spacing[8],
  },
  searchIcon: {
    position: 'absolute',
    left: theme.spacing[3],
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
});
