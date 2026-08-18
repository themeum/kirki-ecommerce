import type { ReactNode } from 'react';
import {
  type FieldValues,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';

/**
 * Mounts a field component inside a real form context.
 *
 * Field components read `control` from `useFormContext()`, so every test of one
 * needs a provider. Form state is observed through `ValueProbe` and driven
 * through `ErrorButton` rather than by capturing the `useForm()` return into an
 * outer variable — reassigning during render is a side effect React's rules
 * forbid, and it makes the test depend on render timing.
 */
const FormHarness = ({
  defaultValues,
  children,
}: {
  defaultValues: FieldValues;
  children: ReactNode;
}) => {
  const form = useForm({ defaultValues });

  return <FormProvider {...form}>{children}</FormProvider>;
};

FormHarness.displayName = 'FormHarness';

/** Renders a field's current value as JSON, for assertions on form state. */
const ValueProbe = ({ name }: { name: string }) => {
  const value: unknown = useWatch({ name });

  return <output data-testid={`probe-${name}`}>{JSON.stringify(value ?? null)}</output>;
};

ValueProbe.displayName = 'ValueProbe';

/** Click target that injects a validation error, so tests need no `act()`. */
const ErrorButton = ({ name, message }: { name: string; message: string }) => {
  const { setError } = useFormContext();

  return (
    <button type="button" onClick={() => setError(name, { message })}>
      {`inject-${name}`}
    </button>
  );
};

ErrorButton.displayName = 'ErrorButton';

/** Click target that clears a field's validation error. */
const ClearErrorButton = ({ name }: { name: string }) => {
  const { clearErrors } = useFormContext();

  return (
    <button type="button" onClick={() => clearErrors(name)}>
      {`clear-${name}`}
    </button>
  );
};

ClearErrorButton.displayName = 'ClearErrorButton';

export { ClearErrorButton, ErrorButton, FormHarness, ValueProbe };
