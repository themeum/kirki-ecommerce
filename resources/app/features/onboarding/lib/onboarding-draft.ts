import type { OnboardingStep } from '@/features/onboarding/lib/steps';
import type { OnboardingFormInput } from '@/features/onboarding/schemas/forms/onboarding-form';

type OnboardingDraft = {
  step: Exclude<OnboardingStep, 4>;
  values: Partial<OnboardingFormInput>;
};

const DRAFT_STORAGE_KEY = 'kirki-ecommerce:onboarding-draft';

const getStorage = (): Storage | undefined => {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
};

const isDraftStep = (step: unknown): step is OnboardingDraft['step'] =>
  step === 0 || step === 1 || step === 2 || step === 3;

const readDraft = (): OnboardingDraft | null => {
  try {
    const raw = getStorage()?.getItem(DRAFT_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const draft = JSON.parse(raw) as Partial<OnboardingDraft>;

    if (!isDraftStep(draft.step) || typeof draft.values !== 'object' || draft.values === null) {
      return null;
    }

    return { step: draft.step, values: draft.values };
  } catch {
    return null;
  }
};

const writeDraft = (draft: OnboardingDraft) => {
  try {
    getStorage()?.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage can be full or disabled; the wizard keeps working from memory.
  }
};

const clearDraft = () => {
  try {
    getStorage()?.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Storage can be disabled; there is nothing to clear then.
  }
};

export { clearDraft, DRAFT_STORAGE_KEY, readDraft, writeDraft };
