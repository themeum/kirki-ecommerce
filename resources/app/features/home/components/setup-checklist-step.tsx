import { useNavigate } from 'react-router';

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import SampleDataProgress from '@/features/home/components/sample-data-progress';
import StepIndicator from '@/features/home/components/step-indicator';
import { useSampleDataImport } from '@/features/home/hooks/use-sample-data-import';
import { getSetupStepDefinition, type SetupStepAction } from '@/features/home/lib/steps';
import type { SetupStep } from '@/features/home/schemas/catalog/setup-checklist';
import { useCompleteSetupStepMutation } from '@/features/home/services/setup-checklist';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type SetupChecklistStepProps = {
  step: SetupStep;
  number: number;
  isOpen: boolean;
  onSampleDataLoaded: () => void;
};

const SetupChecklistStep = ({
  step,
  number,
  isOpen,
  onSampleDataLoaded,
}: SetupChecklistStepProps) => {
  const navigate = useNavigate();
  const { mutateAsync: completeStep, isPending } = useCompleteSetupStepMutation();
  const sampleData = useSampleDataImport({ onLoaded: onSampleDataLoaded });
  const { title, subtitle, timeEstimate, description, actions } = getSetupStepDefinition(step);

  const handleAction = async (action: SetupStepAction) => {
    if (action.kind === 'sample-data') {
      await sampleData.start();
      return;
    }

    if (action.completesStep) {
      await completeStep(step.id).catch(() => undefined);
    }

    void navigate(action.to);
  };

  return (
    <AccordionItem value={step.id} cssOverride={styles.item}>
      <AccordionTrigger cssOverride={styles.header}>
        <Flex align="center" justify="space-between" cssOverride={{ width: '98%' }}>
          <Flex align="center" gap={4}>
            <StepIndicator number={number} isCompleted={step.is_completed} isOpen={isOpen} />
            <Flex direction="column" gap="2px">
              <Text variant="heading5" weight="semibold">
                {title}
              </Text>
              {isOpen && subtitle && (
                <Text variant="tiny" color="secondary">
                  {subtitle}
                </Text>
              )}
            </Flex>
          </Flex>
          {!isOpen && timeEstimate && (
            <Text color="secondary" variant="tiny">
              {timeEstimate}
            </Text>
          )}
        </Flex>
      </AccordionTrigger>
      <AccordionContent>
        <Flex direction="column" gap={4} cssOverride={styles.body}>
          <Text color="secondary">{description}</Text>
          {actions.length > 0 && (
            <Flex gap={3} wrap="wrap">
              {actions.map((action) => {
                const Icon = action.icon;

                if (
                  action.kind === 'sample-data' &&
                  (sampleData.phase === 'downloading' || sampleData.phase === 'creating')
                ) {
                  return (
                    <Button
                      key={action.label}
                      variant={action.variant}
                      aria-disabled="true"
                      aria-busy="true"
                      cssOverride={styles.importingButton}
                    >
                      <SampleDataProgress phase={sampleData.phase} progress={sampleData.progress} />
                    </Button>
                  );
                }

                return (
                  <Button
                    key={action.label}
                    variant={action.variant}
                    loading={action.kind === 'link' && Boolean(action.completesStep) && isPending}
                    disabled={sampleData.isImporting}
                    onClick={() => void handleAction(action)}
                  >
                    {Icon && <Icon size={16} aria-hidden="true" />}
                    {action.label}
                  </Button>
                );
              })}
            </Flex>
          )}
        </Flex>
      </AccordionContent>
    </AccordionItem>
  );
};

SetupChecklistStep.displayName = 'SetupChecklistStep';

export default SetupChecklistStep;

const styles = defineStyles({
  item: {
    borderTop: `1px solid ${theme.colors.border.default}`,
    '& h3': {
      padding: `${theme.spacing[4]} ${theme.spacing[6]}`,
    },
    '&:hover h3[data-state="closed"]': {
      backgroundColor: theme.colors.background.solidSurfaceAlt,
    },
  },
  header: {
    padding: `${theme.spacing[6]} ${theme.spacing[8]}`,
    '& [data-accordion-chevron]': {
      visibility: 'visible',
    },
  },
  importingButton: {
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  body: {
    padding: `0 ${theme.spacing[8]} ${theme.spacing[8]} calc(${theme.spacing[8]} + 20px + ${theme.spacing[4]})`,
  },
});
