import Flex from '@/components/ui/flex';

import Label from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';

const UiTextareaPreview = () => {
  return (
    <Flex direction="column" gap={12} style={{ maxWidth: 320 }}>
      <div>
        <Label htmlFor="ui-textarea-default">Default</Label>
        <Textarea id="ui-textarea-default" placeholder="Write something..." />
      </div>
      <div>
        <Label htmlFor="ui-textarea-error" error>
          With error
        </Label>
        <Textarea id="ui-textarea-error" placeholder="Invalid value" error />
      </div>
    </Flex>
  );
};

UiTextareaPreview.displayName = 'UiTextareaPreview';

export default UiTextareaPreview;
