import { useMutation, useQuery } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import {
  MigrationLatestRunSchema,
  MigrationProgressSchema,
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

const useStartMigrationMutation = () => {
  return useMutation({ mutationFn: startMigration });
};

const useRunMigrationChunkMutation = () => {
  return useMutation({ mutationFn: runMigrationChunk });
};

export {
  type StartMigrationPayload,
  useLatestMigrationRunQuery,
  useMigrationScanQuery,
  useMigrationSourcesQuery,
  useRunMigrationChunkMutation,
  useStartMigrationMutation,
};
