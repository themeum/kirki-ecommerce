import { RefreshCcw } from 'lucide-react';

import Button from '@/components/ui/button';
import {
  useCellSelection,
  useSelectedRowCount,
} from '@/features/bulk-edit/contexts/cell-selection-context';
import { SKU_FIELD } from '@/features/bulk-edit/lib/columns';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SkuGenerateActionProps = {
  onGenerate: (rows: number[]) => void;
  loading: boolean;
};

const SkuGenerateAction = ({ onGenerate, loading }: SkuGenerateActionProps) => {
  const selection = useCellSelection();
  const selectedRowCount = useSelectedRowCount(SKU_FIELD);

  if (selectedRowCount === 0) {
    return null;
  }

  return (
    <span css={scoped(styles.anchor)}>
      <Button
        variant="ghost"
        size="xs"
        loading={loading}
        cssOverride={styles.button}
        onClick={() => onGenerate(selection.getSelectedRows(SKU_FIELD))}
      >
        <RefreshCcw size={12} />
        {__('Generate', 'kirki-ecommerce')}
      </Button>
    </span>
  );
};

SkuGenerateAction.displayName = 'SkuGenerateAction';

export default SkuGenerateAction;

const styles = defineStyles({
  /**
   * Taken out of flow so that mounting it cannot resize the header. In flow it
   * did: the header label is `tiny` typography, an 18px line box, while the
   * `xs` button is a fixed 24px — so selecting a SKU cell grew the shared
   * header row by 6px and stepped the whole grid down with it. Pinning the
   * button to 18px instead would hold only until the next change to Button's
   * sizes; contributing no height at all holds regardless.
   *
   * The positioning lives on this wrapper rather than on the Button because
   * Button's `:active` rule sets `transform: translateY(1px)`. Sharing that one
   * property meant a press replaced the centering outright instead of adding to
   * it, dropping the button ~13px out from under the pointer — so mouseup
   * landed on another element, no click event fired, and nothing generated.
   */
  anchor: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
  },
  button: {
    color: theme.colors.text.emphasis,
  },
});
