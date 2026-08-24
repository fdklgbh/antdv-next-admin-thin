import axios from "axios";
import { describe, expect, it } from "vitest";

import { setupBrowserMock } from "@/mock/browser";

describe("setupBrowserMock", () => {
  it("registers a health endpoint without hitting the network", async () => {
    const client = axios.create({ baseURL: "/api" });
    setupBrowserMock(client);

    const response = await client.get("/__mock_health");

    expect(response.data).toEqual({
      code: 200,
      message: "success",
      success: true,
      data: { enabled: true },
    });
  });

  it("handles all dictionary data", async () => {
    const client = axios.create({ baseURL: "/api" });
    setupBrowserMock(client);

    const response = await client.get("/dict/data/all");

    expect(response.data.code).toBe(200);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.data.length).toBeGreaterThan(0);
  });

  it("handles dashboard endpoints", async () => {
    const client = axios.create({ baseURL: "/api" });
    setupBrowserMock(client);

    const stats = await client.get("/dashboard/stats");
    const chartData = await client.get("/dashboard/chart-data");

    expect(stats.data.code).toBe(200);
    expect(stats.data.data).toBeTruthy();
    expect(chartData.data.code).toBe(200);
    expect(chartData.data.data).toBeTruthy();
  });

  it("handles paginated config list endpoints", async () => {
    const client = axios.create({ baseURL: "/api" });
    setupBrowserMock(client);

    const all = await client.get("/config/list?page=1&pageSize=100");
    const basic = await client.get("/config/list?group=basic&page=1&pageSize=10");

    expect(all.data.code).toBe(200);
    expect(all.data.data.total).toBeGreaterThan(0);
    expect(basic.data.code).toBe(200);
    expect(basic.data.data.list.every((item: { group: string }) => item.group === "basic")).toBe(true);
  });

  it("handles paginated user list endpoints", async () => {
    const client = axios.create({ baseURL: "/api" });
    setupBrowserMock(client);

    const users = await client.get("/users?current=1&pageSize=10");

    expect(users.data.code).toBe(200);
    expect(users.data.data.total).toBeGreaterThan(0);
    expect(users.data.data.list[0].username).toBe("admin");
    expect(users.data.data.list[0].roles).toBeUndefined();
    expect(users.data.data.list[0].permissions).toBeUndefined();
  });

  it("falls back for uncovered demo api list endpoints", async () => {
    const client = axios.create({ baseURL: "/api" });
    setupBrowserMock(client);

    const response = await client.get("/new-example/list?current=2&pageSize=15");

    expect(response.data.code).toBe(200);
    expect(response.data.data).toEqual({
      list: [],
      total: 0,
      current: 2,
      pageSize: 15,
    });
  });

  it("handles system demo endpoints with expected data shapes", async () => {
    const client = axios.create({ baseURL: "/api" });
    setupBrowserMock(client);

    const [dictTypes, dictData, files, operationLogs] = await Promise.all([
      client.get("/dict/types"),
      client.get("/dict/data/gender"),
      client.get("/file/list?page=1&pageSize=10"),
      client.get("/log/operation/list?page=1&pageSize=10"),
    ]);

    expect(Array.isArray(dictTypes.data.data)).toBe(true);
    expect(Array.isArray(dictData.data.data)).toBe(true);
    expect(files.data.data.total).toBeGreaterThan(0);
    expect(operationLogs.data.data.total).toBeGreaterThan(0);
  });
});
