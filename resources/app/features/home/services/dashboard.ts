import { useQuery } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { DashboardOverviewSchema } from '@/features/home/schemas/catalog/dashboard-overview';
import { apiClient } from '@/libs/api';
import { parseData } from '@/services/helpers';

const dashboardKeys = {
  overview: ['DashboardOverview'] as const,
};

const getDashboardOverview = () => {
  return apiClient
    .get(endpoints.DASHBOARD_OVERVIEW)
    .then((response) => parseData(DashboardOverviewSchema, response));
};

const useDashboardOverviewQuery = () => {
  return useQuery({
    queryKey: dashboardKeys.overview,
    queryFn: getDashboardOverview,
    staleTime: 0,
  });
};

export { useDashboardOverviewQuery };
