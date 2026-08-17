import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import NewTag from '@/features/tags/components/new-tag';
import TagTable from '@/features/tags/components/tag-table/tag-table';
import { __ } from '@/wpi18n';

const Tags = () => {
  return (
    <>
      <PageHeading text={__('Tags', 'kirki-ecommerce')} actions={<NewTag />} />
      <Container>
        <TagTable />
      </Container>
    </>
  );
};

Tags.displayName = 'Tags';

export default Tags;

