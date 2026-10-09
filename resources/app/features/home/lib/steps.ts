import { type LucideIcon, Plus, Shirt } from 'lucide-react';

import { RouteConfig } from '@/config/route-config';
import type { SetupStep, SetupStepId } from '@/features/home/schemas/catalog/setup-checklist';
import { __, sprintf } from '@/wpi18n';

type SetupStepAction = {
  label: string;
  variant: 'primary' | 'outline';
  icon?: LucideIcon;
} & ({ kind: 'link'; to: string; completesStep?: boolean } | { kind: 'sample-data' });

type SetupStepDefinition = {
  title: string;
  subtitle?: string;
  timeEstimate?: string;
  description: string;
  actions: SetupStepAction[];
};

const SettingsRoutes = RouteConfig.Settings;

const formatMinutes = (minutes: number) => sprintf(__('%d min', 'kirki-ecommerce'), minutes);

const getAddOrUpdateAction = (
  step: SetupStep,
  addLabel: string,
  updateLabel: string,
  to: string,
): SetupStepAction => {
  if (!step.has_data) {
    return { kind: 'link', label: addLabel, to, variant: 'primary', icon: Plus };
  }

  return {
    kind: 'link',
    label: updateLabel,
    to,
    variant: 'primary',
    completesStep: step.is_preconfigured && !step.is_completed,
  };
};

const getSetupStepDefinition = (step: SetupStep): SetupStepDefinition => {
  const paymentSettingsLink = SettingsRoutes.get('PaymentSettings').buildLink();

  const definitions: Record<SetupStepId, () => SetupStepDefinition> = {
    products: () => ({
      title: __('List your products', 'kirki-ecommerce'),
      timeEstimate: formatMinutes(3),
      description: __(
        'Start selling by adding products or services to your store.',
        'kirki-ecommerce',
      ),
      actions: [
        {
          kind: 'link',
          label: __('Add products', 'kirki-ecommerce'),
          to: RouteConfig.Products.get('CreateProduct').buildLink(),
          variant: 'primary',
          icon: Plus,
        },
        ...(step.has_data
          ? []
          : [
              {
                kind: 'sample-data',
                label: __('Load sample data', 'kirki-ecommerce'),
                variant: 'outline',
                icon: Shirt,
              } satisfies SetupStepAction,
            ]),
      ],
    }),
    payments: () => ({
      title: __('Set up payments', 'kirki-ecommerce'),
      timeEstimate: formatMinutes(2),
      description: __(
        'Choose how customers pay you, such as cards, wallets, or cash on delivery.',
        'kirki-ecommerce',
      ),
      actions: [
        getAddOrUpdateAction(
          step,
          __('Add payment', 'kirki-ecommerce'),
          __('Update payment', 'kirki-ecommerce'),
          paymentSettingsLink,
        ),
      ],
    }),
    tax: () => ({
      title: __('Collect sales tax', 'kirki-ecommerce'),
      timeEstimate: formatMinutes(1),
      description: __(
        'Set your tax rates so customers are charged the right amount at checkout.',
        'kirki-ecommerce',
      ),
      actions: [
        getAddOrUpdateAction(
          step,
          __('Add tax rate', 'kirki-ecommerce'),
          __('Update tax rate', 'kirki-ecommerce'),
          SettingsRoutes.get('TaxSettings').buildLink(),
        ),
      ],
    }),
    shipping: () => ({
      title: __('Add shipping method', 'kirki-ecommerce'),
      timeEstimate: formatMinutes(3),
      description: __(
        'Decide where you ship and what it costs. Offer flat rate, free shipping, or local pickup.',
        'kirki-ecommerce',
      ),
      actions: [
        getAddOrUpdateAction(
          step,
          __('Add shipping', 'kirki-ecommerce'),
          __('Update shipping rate', 'kirki-ecommerce'),
          SettingsRoutes.get('ShippingSettings').buildLink(),
        ),
      ],
    }),
  };

  return definitions[step.id]();
};

const getChecklistProgress = (steps: SetupStep[]) => {
  const completed = steps.filter((step) => step.is_completed).length;
  const total = steps.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percent };
};

const getFirstIncompleteStepId = (steps: SetupStep[]): SetupStepId | '' => {
  return steps.find((step) => !step.is_completed)?.id ?? '';
};

export {
  getChecklistProgress,
  getFirstIncompleteStepId,
  getSetupStepDefinition,
  type SetupStepAction,
};
