import type { McpClientId } from '@/features/settings/mcp/lib/client-configs';
import { getClientLogo } from '@/features/settings/mcp/lib/client-logos';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type ClientLogoProps = {
  clientId: McpClientId;
  title?: string;
};

const ClientLogo = (props: ClientLogoProps) => {
  const { clientId, title } = props;
  const logo = getClientLogo(clientId);

  if (!logo) {
    return null;
  }

  return (
    <span css={scoped(styles.tile)} title={title}>
      <svg viewBox="0 0 24 24" width={16} height={16} fill={logo.color} aria-hidden="true">
        <path d={logo.path} />
      </svg>
    </span>
  );
};

ClientLogo.displayName = 'ClientLogo';

export default ClientLogo;

const styles = defineStyles({
  tile: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    flexShrink: 0,
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border.secondary}`,
    backgroundColor: theme.colors.background.surface,
    color: theme.colors.icon.primary,
  },
});
