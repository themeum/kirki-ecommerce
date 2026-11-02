import { useMutation, useQuery } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import {
  MigrationLatestRunSchema,
  MigrationProgressSchema,
  MigrationRevertProgressSchema,
  MigrationRunSchema,
  MigrationScanSchema,
  MigrationSourcesSchema,
} from '@/features/migration/schemas/catalog/migration';
import { apiClient } from '@/libs/api';
import { parseData, parseResponse } from '@/services/helpers';

const migrationKeys = {
  sources: ['MigrationSources'] as const,
  scan: (source: string) => ['MigrationScan', source] as const,
  latestRun: (source: string) => ['MigrationLatestRun', source] as const,
  run: (runId: number) => ['MigrationRun', runId] as const,
};

const getSources = () => {
  return apiClient
    .get(endpoints.MIGRATION_SOURCES)
    .then((response) => parseData(MigrationSourcesSchema, response));
};

const scanSource = (source: string) => {
  return apiClient
    .post(endpoints.MIGRATION_SCAN, { source })
    .then((response) => parseData(MigrationScanSchema, response));
};

const getRun = (runId: number) => {
  return apiClient
    .get(endpoints.MIGRATION_RUN(runId))
    .then((response) => parseData(MigrationRunSchema, response));
};

const getLatestRun = (source: string) => {
  return apiClient
    .get(endpoints.MIGRATION_LATEST_RUN, { params: { source } })
    .then((response) => parseData(MigrationLatestRunSchema, response));
};

type StartMigrationPayload = {
  source: string;
  groups: string[];
};

const startMigration = (payload: StartMigrationPayload) => {
  return apiClient
    .post(endpoints.MIGRATION_RUNS, payload)
    .then((response) => parseResponse(MigrationRunSchema, response).data);
};

const runMigrationChunk = (runId: number) => {
  return apiClient
    .post(endpoints.MIGRATION_RUN_CHUNK(runId))
    .then((response) => parseResponse(MigrationProgressSchema, response).data);
};

const startRevert = (runId: number) => {
  return apiClient
    .post(endpoints.MIGRATION_RUN_REVERT(runId))
    .then((response) => parseResponse(MigrationRunSchema, response).data);
};

const runRevertChunk = (runId: number) => {
  return apiClient
    .post(endpoints.MIGRATION_RUN_REVERT_CHUNK(runId))
    .then((response) => parseResponse(MigrationRevertProgressSchema, response).data);
};

const useMigrationSourcesQuery = (options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: migrationKeys.sources,
    queryFn: getSources,
    enabled: options.enabled ?? true,
    retry: false,
    staleTime: 60_000,
  });
};

const useMigrationScanQuery = (source: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: migrationKeys.scan(source),
    queryFn: () => scanSource(source),
    enabled: options.enabled ?? true,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

const useLatestMigrationRunQuery = (source: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: migrationKeys.latestRun(source),
    queryFn: () => getLatestRun(source),
    enabled: options.enabled ?? true,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

const useMigrationRunQuery = (runId: number | undefined) => {
  return useQuery({
    queryKey: migrationKeys.run(runId ?? 0),
    queryFn: () => getRun(runId ?? 0),
    enabled: runId !== undefined,
    retry: false,
    staleTime: 0,
  });
};

const useStartMigrationMutation = () => {
  return useMutation({ mutationFn: startMigration });
};

const useRunMigrationChunkMutation = () => {
  return useMutation({ mutationFn: runMigrationChunk });
};

const useStartRevertMutation = () => {
  return useMutation({ mutationFn: startRevert });
};

const useRunRevertChunkMutation = () => {
  return useMutation({ mutationFn: runRevertChunk });
};

export {
  type StartMigrationPayload,
  useLatestMigrationRunQuery,
  useMigrationRunQuery,
  useMigrationScanQuery,
  useMigrationSourcesQuery,
  useRunMigrationChunkMutation,
  useRunRevertChunkMutation,
  useStartMigrationMutation,
  useStartRevertMutation,
};
