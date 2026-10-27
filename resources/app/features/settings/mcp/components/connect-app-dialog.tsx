import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import CodeBlock from '@/features/settings/mcp/components/code-block';
import {
  buildClientConfig,
  type ClientConfig,
  getClientName,
  MCP_CLIENT_IDS,
  type McpClientId,
  PASSWORD_PLACEHOLDER,
} from '@/features/settings/mcp/lib/client-configs';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type ConnectAppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMcpEnabled: boolean;
  serverUrl: string;
  userLogin: string;
  profileUrl: string;
  isApplicationPasswordAvailable: boolean;
};

const configInstruction = (config: ClientConfig, clientName: string) => {
  if (config.format === 'shell') {
    return __('Run this command in a terminal.', 'kirki-ecommerce');
  }

  return sprintf(
    /* translators: %s: name of the AI app */
    __(
      'Add this to the config file of %s. If the file already lists other servers, add only the "kirki-ecommerce" entry. Then restart the app.',
      'kirki-ecommerce',
    ),
    clientName,
  );
};

const ConnectAppDialog = (props: ConnectAppDialogProps) => {
  const {
    open,
    onOpenChange,
    isMcpEnabled,
    serverUrl,
    userLogin,
    profileUrl,
    isApplicationPasswordAvailable,
  } = props;
  const [clientId, setClientId] = useState<McpClientId>('claude-desktop');

  const clientName = getClientName(clientId);
  const config = buildClientConfig(clientId, { serverUrl, userLogin });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent cssOverride={styles.dialogContent}>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>{__('Connect an AI app', 'kirki-ecommerce')}</DialogTitle>
          <DialogDescription>
            {__(
              'Pick the app you use, add the config to it, and give it an application password.',
              'kirki-ecommerce',
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogBody cssOverride={styles.dialogBody}>
          {!isMcpEnabled && (
            <Alert
              type="warning"
              text={__(
                'MCP is off. Turn on Kirki eCommerce MCP on the MCP settings page before the app can connect.',
                'kirki-ecommerce',
              )}
            />
          )}

          <Flex direction="column" gap={2}>
            <Text weight="semibold">{__('1. Choose your app', 'kirki-ecommerce')}</Text>
            <div
              css={scoped(styles.clientList)}
              role="group"
              aria-label={__('AI app', 'kirki-ecommerce')}
            >
              {MCP_CLIENT_IDS.map((id) => (
                <Button
                  key={id}
                  variant={id === clientId ? 'secondary' : 'outline'}
                  size="sm"
                  aria-pressed={id === clientId}
                  onClick={() => setClientId(id)}
                >
                  {getClientName(id)}
                </Button>
              ))}
            </div>
          </Flex>

          <Flex direction="column" gap={2}>
            <Text weight="semibold">{__('2. Add the config', 'kirki-ecommerce')}</Text>
            <Text variant="small" color="secondary">
              {configInstruction(config, clientName)}
            </Text>
            {config.locations.map((location) => (
              <Text key={location.path} variant="small" color="secondary">
                {sprintf(
                  /* translators: %1$s: where the file applies, for example "macOS", %2$s: file path */
                  __('%1$s: %2$s', 'kirki-ecommerce'),
                  location.label,
                  location.path,
                )}
              </Text>
            ))}
            <CodeBlock text={config.text} copyLabel={__('Copy config', 'kirki-ecommerce')} />
            <Text variant="small" color="secondary">
              {__(
                'The config runs the WordPress MCP remote package with npx, so the computer needs Node.js 18 or later.',
                'kirki-ecommerce',
              )}
            </Text>
          </Flex>

          <Flex direction="column" gap={2}>
            <Text weight="semibold">{__('3. Get WP_API_PASSWORD', 'kirki-ecommerce')}</Text>
            {isApplicationPasswordAvailable ? (
              <>
                <ol css={scoped(styles.steps)}>
                  <li>
                    <Flex align="center" gap={2} wrap="wrap">
                      <span>
                        {__(
                          'Open the Application Passwords section of your profile.',
                          'kirki-ecommerce',
                        )}
                      </span>
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        css={scoped(styles.link)}
                      >
                        {__('Open profile', 'kirki-ecommerce')}
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    </Flex>
                  </li>
                  <li>
                    {sprintf(
                      /* translators: %s: name of the AI app */
                      __('Type a name for the app, for example "%s".', 'kirki-ecommerce'),
                      clientName,
                    )}
                  </li>
                  <li>{__('Select "Add New Application Password".', 'kirki-ecommerce')}</li>
                  <li>
                    {__('Copy the password. WordPress shows it one time only.', 'kirki-ecommerce')}
                  </li>
                  <li>
                    {sprintf(
                      /* translators: %s: the placeholder text in the config */
                      __('In the config, replace %s with the password.', 'kirki-ecommerce'),
                      PASSWORD_PLACEHOLDER,
                    )}
                  </li>
                </ol>
                <Text variant="small" color="secondary">
                  {__(
                    'To stop an app, revoke its application password in the same section of your profile.',
                    'kirki-ecommerce',
                  )}
                </Text>
              </>
            ) : (
              <Alert
                type="warning"
                text={__(
                  'Application passwords are not available for your account on this site. WordPress turns them off on sites without HTTPS, and a plugin can also turn them off.',
                  'kirki-ecommerce',
                )}
              />
            )}
          </Flex>
        </DialogBody>

        <DialogFooter>
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            {__('Done', 'kirki-ecommerce')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ConnectAppDialog.displayName = 'ConnectAppDialog';

export default ConnectAppDialog;

const styles = defineStyles({
  dialogContent: {
    width: '640px',
  },
  dialogBody: {
    gap: theme.spacing[5],
  },
  clientList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  steps: {
    ...theme.typography.small(),
    margin: 0,
    paddingLeft: theme.spacing[5],
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[1],
    color: theme.colors.text.primary,
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[1],
    color: theme.colors.text.brand,
  },
});
