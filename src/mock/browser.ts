import type { User } from "@/types/auth";
import type { SysConfig } from "@/types/config";
import type { DictData } from "@/types/dict";
import type { SysFile } from "@/types/file";
import type { OperationLog } from "@/types/log";
import type { AxiosInstance } from "axios";

import AxiosMockAdapter from "axios-mock-adapter";

import avatarImg from "@/assets/images/avatar-256.png";

import {
  mockActivities,
  mockChartData,
  mockSalesTrend,
  mockStats,
  mockUserDistribution,
} from "../../mock/data/dashboard.data";
import { sysConfigs } from "../../mock/data/config.data";
import { dictTypes, dictData } from "../../mock/data/dict.data";
import { sysFiles } from "../../mock/data/file.data";
import { operationLogs } from "../../mock/data/log.data";

const SUCCESS_MESSAGE = "success";
const DEMO_CREATED_AT = "2023-01-01T00:00:00.000Z";
const DEMO_UPDATED_AT = "2023-01-01T00:00:00.000Z";

const adminUser: User = {
  id: "1",
  username: "admin",
  email: "admin@example.com",
  realName: "Administrator",
  avatar: avatarImg,
  phone: "13800138000",
  gender: "male",
  birthDate: "1990-01-01",
  bio: "System Administrator",
  status: "active",
  createdAt: DEMO_CREATED_AT,
  updatedAt: DEMO_UPDATED_AT,
};

const regularUser: User = {
  id: "2",
  username: "user",
  email: "user@example.com",
  realName: "Regular User",
  avatar: avatarImg,
  phone: "13800138001",
  gender: "female",
  birthDate: "1995-05-15",
  bio: "Regular User",
  status: "active",
  createdAt: DEMO_CREATED_AT,
  updatedAt: DEMO_UPDATED_AT,
};

const demoUsers: User[] = [
  adminUser,
  regularUser,
  {
    id: "3",
    username: "manager",
    email: "manager@example.com",
    realName: "Demo Manager",
    avatar: avatarImg,
    phone: "13800138002",
    gender: "male",
    birthDate: "1992-08-12",
    bio: "Demo Manager",
    status: "active",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT,
  },
  {
    id: "4",
    username: "guest",
    email: "guest@example.com",
    realName: "Demo Guest",
    avatar: avatarImg,
    phone: "13800138003",
    gender: "female",
    birthDate: "1998-03-20",
    bio: "Demo Guest",
    status: "inactive",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT,
  },
];

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

function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

function getQueryParam(configUrl: string | undefined, key: string): string {
  const url = new URL(configUrl || "", "https://mock.local");
  return url.searchParams.get(key) || "";
}

function getConfigList(url: string | undefined) {
  const name = getQueryParam(url, "name");
  const key = getQueryParam(url, "key");
  const group = getQueryParam(url, "group");
  const page = Number(getQueryParam(url, "page") || 1);
  const pageSize = Number(getQueryParam(url, "pageSize") || 20);

  let filtered = cloneData<SysConfig[]>(sysConfigs);

  if (name) {
    filtered = filtered.filter((item) => item.name.includes(name));
  }
  if (key) {
    filtered = filtered.filter((item) => item.key.includes(key));
  }
  if (group) {
    filtered = filtered.filter((item) => item.group === group);
  }

  filtered.sort((a, b) => a.sort - b.sort);
  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current: page,
    pageSize,
  };
}

function getDictTypeList(url: string | undefined) {
  const name = getQueryParam(url, "name");
  const code = getQueryParam(url, "code");
  const status = getQueryParam(url, "status");
  const page = Number(getQueryParam(url, "page") || 1);
  const pageSize = Number(getQueryParam(url, "pageSize") || 10);

  let filtered = cloneData(dictTypes);

  if (name) filtered = filtered.filter((item) => item.name.includes(name));
  if (code) filtered = filtered.filter((item) => item.code.includes(code));
  if (status) filtered = filtered.filter((item) => item.status === status);

  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current: page,
    pageSize,
  };
}

function getDictDataList(url: string | undefined) {
  const typeCode = getQueryParam(url, "typeCode");
  const label = getQueryParam(url, "label");
  const value = getQueryParam(url, "value");
  const status = getQueryParam(url, "status");
  const page = Number(getQueryParam(url, "page") || 1);
  const pageSize = Number(getQueryParam(url, "pageSize") || 10);

  let filtered = cloneData<DictData[]>(dictData);

  if (typeCode) filtered = filtered.filter((item) => item.typeCode === typeCode);
  if (label) filtered = filtered.filter((item) => item.label.includes(label));
  if (value) filtered = filtered.filter((item) => item.value.includes(value));
  if (status) filtered = filtered.filter((item) => item.status === status);

  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current: page,
    pageSize,
  };
}

function getFileList(url: string | undefined) {
  const name = getQueryParam(url, "name");
  const ext = getQueryParam(url, "ext");
  const storage = getQueryParam(url, "storage");
  const page = Number(getQueryParam(url, "page") || 1);
  const pageSize = Number(getQueryParam(url, "pageSize") || 20);

  let filtered = cloneData<SysFile[]>(sysFiles);

  if (name) filtered = filtered.filter((item) => item.originalName.includes(name));
  if (ext) filtered = filtered.filter((item) => item.ext === ext);
  if (storage) filtered = filtered.filter((item) => item.storage === storage);

  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current: page,
    pageSize,
  };
}

function getOperationLogList(url: string | undefined) {
  const username = getQueryParam(url, "username");
  const module = getQueryParam(url, "module");
  const action = getQueryParam(url, "action");
  const status = getQueryParam(url, "status");
  const startTime = getQueryParam(url, "startTime");
  const endTime = getQueryParam(url, "endTime");
  const page = Number(getQueryParam(url, "page") || 1);
  const pageSize = Number(getQueryParam(url, "pageSize") || 10);

  let filtered = cloneData<OperationLog[]>(operationLogs);

  if (username) filtered = filtered.filter((item) => item.username.includes(username));
  if (module) filtered = filtered.filter((item) => item.module === module);
  if (action) filtered = filtered.filter((item) => item.action === action);
  if (status) filtered = filtered.filter((item) => item.status === status);
  if (startTime) filtered = filtered.filter((item) => item.createTime >= startTime);
  if (endTime) filtered = filtered.filter((item) => item.createTime <= endTime);

  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current: page,
    pageSize,
  };
}

function getPaginatedUsers(url: string | undefined) {
  const username = getQueryParam(url, "username").toLowerCase();
  const email = getQueryParam(url, "email").toLowerCase();
  const status = getQueryParam(url, "status");
  const gender = getQueryParam(url, "gender");
  const current = Number(getQueryParam(url, "current") || 1);
  const pageSize = Number(getQueryParam(url, "pageSize") || 10);

  let filtered = cloneData<User[]>(demoUsers);

  if (username) {
    filtered = filtered.filter((item) => item.username.toLowerCase().includes(username));
  }
  if (email) {
    filtered = filtered.filter((item) => item.email.toLowerCase().includes(email));
  }
  if (status) {
    filtered = filtered.filter((item) => item.status === status);
  }
  if (gender) {
    const genderValues = gender.split(",").map((item) => item.trim()).filter(Boolean);
    filtered = filtered.filter((item) => genderValues.includes(String(item.gender)));
  }

  const start = (current - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current,
    pageSize,
  };
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
    .onGet(/\/api\/dict\/types$|\/dict\/types$/)
    .reply(200, successResponse(cloneData(dictTypes)));
  mock
    .onGet(/\/api\/dict\/type\/list(?:\?.*)?$|\/dict\/type\/list(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getDictTypeList(config.url))]);
  mock.onPost(/\/api\/dict\/type$|\/dict\/type$/).reply((config) => {
    const body = parseJsonBody(config.data, {});
    return [200, successResponse({ id: String(Date.now()), ...body })];
  });
  mock.onPut(/\/api\/dict\/type\/[^/]+$|\/dict\/type\/[^/]+$/).reply((config) => {
    const body = parseJsonBody(config.data, {});
    const id = config.url?.split("/dict/type/")[1]?.split("?")[0] || "";
    return [200, successResponse({ id, ...body })];
  });
  mock.onDelete(/\/api\/dict\/type\/[^/]+$|\/dict\/type\/[^/]+$/).reply(200, successResponse(null));

  mock
    .onGet(/\/api\/dict\/data\/all$|\/dict\/data\/all$/)
    .reply(200, successResponse(cloneData<DictData[]>(dictData)));
  mock
    .onGet(/\/api\/dict\/data\/list(?:\?.*)?$|\/dict\/data\/list(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getDictDataList(config.url))]);
  mock.onGet(/\/api\/dict\/data\/[^/]+$|\/dict\/data\/[^/]+$/).reply((config) => {
    const typeCode = config.url?.split("/dict/data/")[1]?.split("?")[0] || "";
    const list = dictData.filter((item) => item.typeCode === typeCode && item.status === "enabled");
    return [200, successResponse(cloneData(list))];
  });
  mock.onPost(/\/api\/dict\/data$|\/dict\/data$/).reply((config) => {
    const body = parseJsonBody(config.data, {});
    return [200, successResponse({ id: String(Date.now()), ...body })];
  });
  mock.onPut(/\/api\/dict\/data\/[^/]+$|\/dict\/data\/[^/]+$/).reply((config) => {
    const body = parseJsonBody(config.data, {});
    const id = config.url?.split("/dict/data/")[1]?.split("?")[0] || "";
    return [200, successResponse({ id, ...body })];
  });
  mock.onDelete(/\/api\/dict\/data\/[^/]+$|\/dict\/data\/[^/]+$/).reply(200, successResponse(null));

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

  mock
    .onGet(/\/api\/file\/list(?:\?.*)?$|\/file\/list(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getFileList(config.url))]);
  mock.onDelete(/\/api\/file\/[^/]+$|\/file\/[^/]+$/).reply(200, successResponse(null));

  mock
    .onGet(/\/api\/log\/operation\/list(?:\?.*)?$|\/log\/operation\/list(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getOperationLogList(config.url))]);
  mock.onDelete(/\/api\/log\/operation\/clear$|\/log\/operation\/clear$/).reply(200, successResponse(null));

  mock
    .onGet(/\/api\/users(?:\?.*)?$|\/users(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getPaginatedUsers(config.url))]);

  mock.onGet(/\/api\/users\/[^/]+$|\/users\/[^/]+$/).reply((config) => {
    const id = config.url?.split("/users/")[1]?.split("?")[0] || "";
    const item = demoUsers.find((user) => user.id === id);

    if (!item) {
      return [200, { code: 404, message: "User not found", success: false, data: null }];
    }

    return [200, successResponse(cloneData(item))];
  });

  mock.onPost(/\/api\/users$|\/users$/).reply((config) => {
    const body = parseJsonBody<Partial<User>>(config.data, {});
    return [
      200,
      successResponse({
        ...regularUser,
        ...body,
        id: String(Date.now()),
        username: body.username || `user_${Date.now()}`,
        email: body.email || "user@example.com",
        realName: body.realName || "Demo User",
        avatar: body.avatar || avatarImg,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ];
  });

  mock.onPut(/\/api\/users\/[^/]+$|\/users\/[^/]+$/).reply((config) => {
    const body = parseJsonBody<Partial<User>>(config.data, {});
    const id = config.url?.split("/users/")[1]?.split("?")[0] || "";
    const item = demoUsers.find((user) => user.id === id) || regularUser;
    return [200, successResponse({ ...item, ...body, updatedAt: new Date().toISOString() })];
  });

  mock.onDelete(/\/api\/users\/[^/]+$|\/users\/[^/]+$/).reply(200, successResponse(null));
  mock.onPost(/\/api\/users\/change-password$|\/users\/change-password$/).reply(200, successResponse(null));

  mock
    .onGet(/\/api\/config\/list(?:\?.*)?$|\/config\/list(?:\?.*)?$/)
    .reply((config) => [200, successResponse(getConfigList(config.url))]);

  mock.onGet(/\/api\/config\/key\/[^/]+$|\/config\/key\/[^/]+$/).reply((config) => {
    const key = config.url?.split("/config/key/")[1]?.split("?")[0] || "";
    const item = sysConfigs.find((configItem) => configItem.key === key);

    if (!item) {
      return [200, { code: 404, message: "Config not found", success: false }];
    }

    return [200, successResponse(cloneData(item))];
  });

  mock.onPost(/\/api\/config$|\/config$/).reply((config) => {
    const body = parseJsonBody<Partial<SysConfig>>(config.data, {});
    const newConfig: SysConfig = {
      id: String(Date.now()),
      name: body.name || "Custom Config",
      key: body.key || `custom.${Date.now()}`,
      value: body.value || "",
      valueType: body.valueType || "string",
      group: body.group || "basic",
      description: body.description || "",
      builtIn: false,
      sort: body.sort || 100,
      createTime: new Date().toISOString().replace("T", " ").slice(0, 19),
      updateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
    };

    return [200, successResponse(newConfig)];
  });

  mock.onPut(/\/api\/config\/[^/]+$|\/config\/[^/]+$/).reply((config) => {
    const body = parseJsonBody<Partial<SysConfig>>(config.data, {});
    const id = config.url?.split("/config/")[1]?.split("?")[0] || "";
    const item = sysConfigs.find((configItem) => configItem.id === id);

    if (!item) {
      return [200, { code: 404, message: "Config not found", success: false }];
    }

    return [
      200,
      successResponse({
        ...item,
        ...body,
        updateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
      }),
    ];
  });

  mock.onDelete(/\/api\/config\/[^/]+$|\/config\/[^/]+$/).reply(200, successResponse(null));

  mock.onAny(/^\/|\/api\//).reply((config) => [200, fallbackDemoResponse(config)]);

  mock.onAny().passThrough();

  return mock;
}

export { successResponse };
