import { useQuery } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { DashboardAttentionSchema } from '@/features/home/schemas/catalog/dashboard-attention';
import { DashboardOverviewSchema } from '@/features/home/schemas/catalog/dashboard-overview';
import { apiClient } from '@/libs/api';
import { parseData } from '@/services/helpers';

const dashboardKeys = {
  overview: ['DashboardOverview'] as const,
  attention: ['DashboardAttention'] as const,
};

const getDashboardOverview = () => {
  return apiClient
    .get(endpoints.DASHBOARD_OVERVIEW)
    .then((response) => parseData(DashboardOverviewSchema, response));
};

const useDashboardOverviewQuery = (enabled = true) => {
  return useQuery({
    queryKey: dashboardKeys.overview,
    queryFn: getDashboardOverview,
    staleTime: 0,
    enabled,
  });
};

const getDashboardAttention = () => {
  return apiClient
    .get(endpoints.DASHBOARD_ATTENTION)
    .then((response) => parseData(DashboardAttentionSchema, response));
};

const useDashboardAttentionQuery = (enabled = true) => {
  return useQuery({
    queryKey: dashboardKeys.attention,
    queryFn: getDashboardAttention,
    staleTime: 0,
    enabled,
  });
};

export { useDashboardAttentionQuery, useDashboardOverviewQuery };
