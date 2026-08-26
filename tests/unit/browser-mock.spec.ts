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

});
