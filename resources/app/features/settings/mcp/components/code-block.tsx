import { Copy } from 'lucide-react';

import Button from '@/components/ui/button';
import { theme } from '@/theme';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { copyToClipboard } from '@/utils';
import { __ } from '@/wpi18n';

type CodeBlockProps = {
  text: string;
  copyLabel: string;
  isInline?: boolean;
};

const CodeBlock = (props: CodeBlockProps) => {
  const { text, copyLabel, isInline = false } = props;

  return (
    <div css={scoped(mergeCss(styles.wrapper, isInline && styles.inlineWrapper))}>
      <pre css={scoped(mergeCss(styles.code, isInline && styles.inlineCode))}>{text}</pre>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={copyLabel}
        title={__('Copy', 'kirki-ecommerce')}
        onClick={() => void copyToClipboard(text)}
        cssOverride={styles.copyButton}
      >
        <Copy size={14} />
      </Button>
    </div>
  );
};

CodeBlock.displayName = 'CodeBlock';

export default CodeBlock;

const styles = defineStyles({
  wrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing[1],
    width: '100%',
    padding: theme.spacing[1],
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.secondary}`,
    backgroundColor: theme.colors.background.surfaceAlt,
  },
  inlineWrapper: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
  },
  code: {
    ...theme.typography.tiny(),
    flex: 1,
    minWidth: 0,
    margin: 0,
    padding: theme.spacing[2],
    overflowX: 'auto',
    whiteSpace: 'pre',
    color: theme.colors.text.primary,
  },
  inlineCode: {
    ...theme.typography.small(),
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    whiteSpace: 'nowrap',
  },
  copyButton: {
    flexShrink: 0,
  },
});
