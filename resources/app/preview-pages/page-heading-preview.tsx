import Button from '@/components/ui/button';
import PageHeading from '@/molecules/page-heading';

const PageHeadingPreview = () => {
  const actionButtons = (
    <>
      <Button variant="ghost">Import</Button>
      <Button variant="ghost">Export</Button>
      <Button variant="primary">Add Product</Button>
    </>
  );

  return (
    <div>
      <PageHeading text="Products Table" actions={actionButtons} />
    </div>
  );
};

PageHeadingPreview.displayName = 'PageHeadingPreview';

export default PageHeadingPreview;
