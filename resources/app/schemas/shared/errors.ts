import type { ZodIssue } from 'zod';

class ApiValidationError extends Error {
  issues: ZodIssue[];

  constructor(issues: ZodIssue[]) {
    super('API response validation failed');
    this.name = 'ApiValidationError';
    this.issues = issues;
  }
}

const isApiValidationError = (error: unknown): error is ApiValidationError => {
  return error instanceof ApiValidationError;
};

const formatValidationIssues = (issues: ZodIssue[]) => {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
};

export { ApiValidationError, isApiValidationError, formatValidationIssues };
