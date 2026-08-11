import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';

const UiButtonPreview = () => {
  return (
    <Flex gap={2} wrap="wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
      <Button variant="outline" size="sm">
        Small
      </Button>
      <Button variant="outline" size="lg">
        Large
      </Button>
      <Button variant="primary" loading>
        Loading
      </Button>
      <Button variant="outline" disabled>
        Disabled
      </Button>
    </Flex>
  );
};

UiButtonPreview.displayName = 'UiButtonPreview';

export default UiButtonPreview;
