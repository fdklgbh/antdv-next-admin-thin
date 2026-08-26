import type { AxiosInstance } from "axios";

import AxiosMockAdapter from "axios-mock-adapter";

import {
  mockActivities,
  mockChartData,
  mockSalesTrend,
  mockStats,
  mockUserDistribution,
} from "../../mock/data/dashboard.data";

const SUCCESS_MESSAGE = "success";

function successResponse<T>(data: T) {
  return {
    code: 200,
    message: SUCCESS_MESSAGE,
    success: true,
    data,
  };
}

function parseJsonBody<T>(data: unknown, fallback: T): T {
  if (typeof data !== "string") return fallback;

  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

function getQueryParam(configUrl: string | undefined, key: string): string {
  const url = new URL(configUrl || "", "https://mock.local");
  return url.searchParams.get(key) || "";
}

function getPageParams(url: string | undefined) {
  return {
    current: Number(getQueryParam(url, "current") || getQueryParam(url, "page") || 1),
    pageSize: Number(getQueryParam(url, "pageSize") || 10),
  };
}

function fallbackDemoResponse(config: { data?: unknown; method?: string; url?: string }) {
  const method = config.method?.toLowerCase() || "get";
  const url = config.url || "";

  if (method === "get" && /\/list(?:\?.*)?$|[?&](current|page|pageSize)=/.test(url)) {
    const { current, pageSize } = getPageParams(url);
    return successResponse({ list: [], total: 0, current, pageSize });
  }

  if (method === "post" || method === "put" || method === "patch") {
    return successResponse(parseJsonBody(config.data, null));
  }

  return successResponse(null);
}

export function setupBrowserMock(service: AxiosInstance): AxiosMockAdapter {
  const mock = new AxiosMockAdapter(service, { delayResponse: 250 });

  mock.onGet(/\/api\/__mock_health$|\/__mock_health$/).reply(200, {
    code: 200,
    message: SUCCESS_MESSAGE,
    success: true,
    data: { enabled: true },
  });

  mock
    .onGet(/\/api\/dashboard\/stats$|\/dashboard\/stats$/)
    .reply(200, successResponse(mockStats));
  mock
    .onGet(/\/api\/dashboard\/sales-trend$|\/dashboard\/sales-trend$/)
    .reply(200, successResponse(mockSalesTrend));
  mock
    .onGet(/\/api\/dashboard\/user-distribution$|\/dashboard\/user-distribution$/)
    .reply(200, successResponse(mockUserDistribution));
  mock
    .onGet(/\/api\/dashboard\/activities$|\/dashboard\/activities$/)
    .reply(200, successResponse(mockActivities));
  mock
    .onGet(/\/api\/dashboard\/chart-data$|\/dashboard\/chart-data$/)
    .reply(200, successResponse(mockChartData));

  mock.onAny(/^\/|\/api\//).reply((config) => [200, fallbackDemoResponse(config)]);

  mock.onAny().passThrough();

  return mock;
}

export { successResponse };
