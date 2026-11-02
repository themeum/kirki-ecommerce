import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { Accordion } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Skeleton from '@/components/ui/skeleton';
import Text from '@/components/ui/text';
import SetupChecklistStep from '@/features/home/components/setup-checklist-step';
import { getChecklistProgress, getFirstIncompleteStepId } from '@/features/home/lib/steps';
import type { SetupStep } from '@/features/home/schemas/catalog/setup-checklist';
import { useSetupChecklistQuery } from '@/features/home/services/setup-checklist';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type SetupChecklistStepsProps = {
  steps: SetupStep[];
};

const SetupChecklistSteps = ({ steps }: SetupChecklistStepsProps) => {
  const [openStepId, setOpenStepId] = useState<string>(() => getFirstIncompleteStepId(steps));
  const stepsRef = useRef(steps);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);
  const { completed, total, percent } = getChecklistProgress(steps);

  return (
    <Card cssOverride={styles.card}>
      <Flex direction="column" gap={2} cssOverride={styles.progress}>
        <Flex align="center" justify="space-between">
          <Text weight="medium" variant="tiny">
            {sprintf(__('%1$d out of %2$d complete', 'kirki-ecommerce'), completed, total)}
          </Text>
          <Text color="emphasis" variant="small" weight="semibold">
            {sprintf(__('%d%%', 'kirki-ecommerce'), percent)}
          </Text>
        </Flex>
        <div
          role="progressbar"
          aria-label={__('Setup progress', 'kirki-ecommerce')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          css={scoped(styles.track)}
        >
          <div
            css={scoped(styles.fill)}
            style={{ '--setup-progress-width': `${percent}%` } as CSSProperties}
          />
        </div>
      </Flex>
      <Accordion
        type="single"
        hideSeparator
        hasBottomSpace={false}
        cssOverride={styles.accordion}
        value={openStepId}
        onValueChange={(value) => setOpenStepId(typeof value === 'string' ? value : '')}
      >
        {steps.map((step, index) => (
          <SetupChecklistStep
            key={step.id}
            step={step}
            number={index + 1}
            isOpen={openStepId === step.id}
            onSampleDataLoaded={() => setOpenStepId(getFirstIncompleteStepId(stepsRef.current))}
          />
        ))}
      </Accordion>
    </Card>
  );
};

SetupChecklistSteps.displayName = 'SetupChecklistSteps';

const SetupChecklist = () => {
  const { data, isLoading, isError } = useSetupChecklistQuery();

  if (isLoading) {
    return (
      <Card cssOverride={styles.card}>
        <Flex direction="column" gap={4} cssOverride={styles.progress}>
          <Skeleton width="160px" height="20px" />
          <Skeleton width="100%" height="8px" radius="full" />
        </Flex>
        {[1, 2, 3, 4, 5].map((row) => (
          <Flex key={row} align="center" gap={4} cssOverride={styles.skeletonRow}>
            <Skeleton width="40px" height="40px" radius="full" />
            <Skeleton width="220px" height="24px" />
          </Flex>
        ))}
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card cssOverride={styles.card}>
        <Text color="critical" cssOverride={styles.error}>
          {__('We could not load your setup checklist. Please reload the page.', 'kirki-ecommerce')}
        </Text>
      </Card>
    );
  }

  return <SetupChecklistSteps steps={data.steps} />;
};

SetupChecklist.displayName = 'SetupChecklist';

export default SetupChecklist;

const styles = defineStyles({
  card: {
    padding: 0,
    overflow: 'hidden',
    gap: 0,
  },
  progress: {
    padding: `${theme.spacing[8]} ${theme.spacing[6]}`,
  },
  track: {
    height: '8px',
    width: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surfaceSecondary,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    width: 'var(--setup-progress-width)',
    borderRadius: 'inherit',
    backgroundColor: theme.colors.background.fillBrand,
    transition: 'width 0.2s ease',
  },
  accordion: {
    width: '100%',
  },
  skeletonRow: {
    padding: `${theme.spacing[6]} ${theme.spacing[8]}`,
    borderTop: `1px solid ${theme.colors.border.default}`,
  },
  error: {
    padding: theme.spacing[8],
  },
});
