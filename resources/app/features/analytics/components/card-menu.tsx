import { MoreHorizontal, X } from 'lucide-react';
import { createContext } from 'react';

import Button from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type CardMenuValue = {
  canHide: boolean;
  onHide: () => void;
};

const CardMenuContext = createContext<CardMenuValue | null>(null);

type CardMenuProps = CardMenuValue & {
  title: string;
};

const CardMenu = (props: CardMenuProps) => {
  const { title, canHide, onHide } = props;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          data-card-menu="true"
          aria-label={sprintf(
            /* translators: %s: title of the analytics card */
            __('More actions for %s', 'kirki-ecommerce'),
            title,
          )}
          cssOverride={styles.trigger}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={!canHide} onSelect={onHide}>
          <X size={14} aria-hidden="true" />
          {__('Hide from page', 'kirki-ecommerce')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

CardMenu.displayName = 'CardMenu';

export default CardMenu;
export { CardMenuContext };
export type { CardMenuValue };

const styles = defineStyles({
  trigger: {
    flexShrink: 0,
    margin: `-${theme.spacing[1]} -${theme.spacing[1]} -${theme.spacing[1]} auto`,
  },
});
