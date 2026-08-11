import PageNavbar from '@/components/page-navbar';
import Flex from '@/components/ui/flex';
import { HomeIcon } from '@/icons';

const PageNavbarPreview = () => {
  return (
    <Flex cssOverride={{ width: '100%' }}>
      <PageNavbar
        style={{ width: '100%' }}
        textIcon={<HomeIcon />}
        text="Home"
      />
    </Flex>
  );
};

PageNavbarPreview.displayName = 'PageNavbarPreview';

export default PageNavbarPreview;
