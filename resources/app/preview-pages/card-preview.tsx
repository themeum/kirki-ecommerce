import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

const CardPreview = () => {
  return (
    <Flex direction="column" gap={16}>
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>
            This is a short description of the card content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          Card body content goes here. Use this area for primary information.
        </CardContent>
        <CardFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Save</Button>
        </CardFooter>
      </Card>

      <Card css={styles.formCard}>
        <CardContent>Form card variant</CardContent>
      </Card>

      <Card css={styles.innerCard}>
        <CardContent css={styles.innerContent}>Inner card variant</CardContent>
      </Card>

      <Card css={styles.darkCard}>
        <CardContent>Dark card variant</CardContent>
      </Card>

      <Card css={styles.lightCard}>
        <CardContent>Light card variant</CardContent>
      </Card>

      <Card css={styles.tableCard}>
        <CardContent css={styles.tableContent}>Table card variant</CardContent>
      </Card>

      <Card css={styles.shadowCard}>
        <CardContent>Shadow card variant</CardContent>
      </Card>

      <Card css={styles.largeCard}>
        <CardContent css={styles.largeContent}>Large card variant</CardContent>
      </Card>
    </Flex>
  );
};

CardPreview.displayName = 'CardPreview';

export default CardPreview;

const styles = {
  formCard: scoped({
    rowGap: theme.spacing['2xl'],
  }),
  innerCard: scoped({
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerContent: scoped({
    padding: theme.spacing.lg,
  }),
  darkCard: scoped({
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
  lightCard: scoped({
    borderRadius: theme.radius.md,
    padding: theme.spacing.none,
  }),
  tableCard: scoped({
    overflow: 'hidden',
    border: '1px solid #e6e6e6',
    gap: 0,
    padding: theme.spacing.none,
  }),
  tableContent: scoped({
    padding: theme.spacing.none,
  }),
  shadowCard: scoped({
    boxShadow: '0px -1px 1px 0.5px #0000001a inset',
    border: 'none',
  }),
  largeCard: scoped({
    gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({
    padding: theme.spacing['3xl'],
  }),
};
