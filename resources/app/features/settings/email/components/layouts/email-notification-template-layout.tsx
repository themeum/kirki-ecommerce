import { keyframes } from '@emotion/react';
import type { PropsWithChildren } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import { RouteConfig } from '@/config/route-config';
import { useEditNotificationTemplate } from '@/features/settings/email/hooks/use-edit-notification-template';
import { emailTemplateStyles } from '@/features/settings/email/lib/template';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const EmailNotificationTemplateLayout = (props: PropsWithChildren) => {
  const navigate = useNavigate();
  const { form, label, isDirty, isSaving, shakeSignal, onSave, onDiscard } =
    useEditNotificationTemplate();

  const handleBack = () => {
    void navigate(RouteConfig.Settings.get('EmailSettings').buildLink());
  };

  return (
    <Page containerSize="xl">
      <Form {...form}>
        <PageHeading
          hasBack
          onBack={handleBack}
          text={label}
          buttonProps={{ disabled: isSaving }}
          sticky
          actions={
            <Flex
              key={shakeSignal}
              gap={2}
              cssOverride={shakeSignal > 0 ? styles.shaking : undefined}
            >
              {isDirty && (
                <Button variant="tertiary" onClick={onDiscard} disabled={isSaving}>
                  {__('Discard', 'kirki-ecommerce')}
                </Button>
              )}
              <Button variant="primary" onClick={onSave} loading={isSaving}>
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </Flex>
          }
        />
        <PageContent containerSize="xl" cssOverride={emailTemplateStyles.container}>
          {props.children}
        </PageContent>
      </Form>
    </Page>
  );
};

EmailNotificationTemplateLayout.displayName = 'EmailNotificationTemplateLayout';

export default EmailNotificationTemplateLayout;

const shake = keyframes({
  '0%, 100%': { transform: 'translateX(0)' },
  '20%': { transform: 'translateX(-10px)' },
  '40%': { transform: 'translateX(10px)' },
  '60%': { transform: 'translateX(-6px)' },
  '80%': { transform: 'translateX(6px)' },
});

const styles = defineStyles({
  shaking: {
    animation: `${shake} 0.3s ease-in-out 0.2s 1`,
  },
});
