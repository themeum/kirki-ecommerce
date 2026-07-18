import Button from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const UiPopoverPreview = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div>
          <strong>Anchored popover</strong>
          <p>This opens beside the trigger using Radix positioning.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

UiPopoverPreview.displayName = 'UiPopoverPreview';

export default UiPopoverPreview;
