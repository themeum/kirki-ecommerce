import PageNavbar from '@/components/page-navbar';
import { HomeIcon } from '@/icons';
import Flex from '@/components/ui/flex';

const PageNavbarPreview = () => {
  return (
    <Flex cssOverride={{ width: '100%' }}>
      <PageNavbar
        style={{ width: '100%' }}
        textIcon={<HomeIcon />}
        text={'Home'}
      />
    </Flex>
  );
};

PageNavbarPreview.displayName = 'PageNavbarPreview';

export default PageNavbarPreview;
