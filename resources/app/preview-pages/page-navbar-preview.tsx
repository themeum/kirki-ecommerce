import PageNavbar from '@/components/page-navbar';
import { HomeIcon } from '@/icons';
import Flex from '@/molecules/flex';

const PageNavbarPreview = () => {
  return (
    <Flex style={{ width: '100%' }}>
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
