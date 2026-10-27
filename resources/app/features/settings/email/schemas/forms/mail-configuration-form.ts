import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';

export const MailerOptions = ['smtp', 'php_mail'] as const;
export const EncryptionOptions = ['none', 'ssl', 'tls'] as const;

export const MailConfigurationShape = z.object({
  from_email: z.string().nullish(),
  from_name: z.string().nullish(),
  mailer: z.enum(MailerOptions).nullish(),
  host: z.string().nullish(),
  port: z.number().nullish(),
  encryption: z.enum(EncryptionOptions).nullish(),
  is_authentication_enabled: z.boolean().nullish(),
  username: z.string().nullish(),
  password: z.string().nullish(),
});

export const MailConfigurationFormSchema = prepareFormSchema(MailConfigurationShape).transform(
  (values) => {
    const isSmtp = values.mailer === 'smtp';

    return {
      from_email: values.from_email,
      from_name: values.from_name,
      mailer: values.mailer,
      host: isSmtp ? values.host : null,
      port: isSmtp ? values.port : null,
      encryption: isSmtp ? values.encryption : null,
      is_authentication_enabled: isSmtp ? values.is_authentication_enabled : null,
      username: isSmtp ? values.username : null,
      password: isSmtp ? values.password : null,
    };
  },
);

export type MailConfigurationFormInput = z.input<typeof MailConfigurationFormSchema>;

export type MailConfigurationFormPayload = z.output<typeof MailConfigurationFormSchema>;
