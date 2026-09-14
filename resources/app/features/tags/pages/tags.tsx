import { Page, PageContent, PageHeading } from '@/components/ui/page';
import NewTag from '@/features/tags/components/new-tag';
import TagTable from '@/features/tags/components/tag-table/tag-table';
import { __ } from '@/wpi18n';

const Tags = () => {
  return (
    <Page>
      <PageHeading text={__('Tags', 'kirki-ecommerce')} actions={<NewTag />} />
      <PageContent>
        <TagTable />
      </PageContent>
    </Page>
  );
};

Tags.displayName = 'Tags';

export default Tags;
