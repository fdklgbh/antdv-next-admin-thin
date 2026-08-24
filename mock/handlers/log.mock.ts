import { defineMock } from "vite-plugin-mock-dev-server";

import { operationLogs } from "../data/log.data";

export default defineMock([
  {
    url: "/api/log/operation/list",
    method: "GET",
    body: (req) => {
      const {
        username,
        module,
        action,
        status,
        startTime,
        endTime,
        page = 1,
        pageSize = 10,
      } = req.query;

      let filtered = [...operationLogs];

      if (username) {
        filtered = filtered.filter((item) =>
          item.username.includes(username as string),
        );
      }
      if (module) {
        filtered = filtered.filter((item) => item.module === module);
      }
      if (action) {
        filtered = filtered.filter((item) => item.action === action);
      }
      if (status) {
        filtered = filtered.filter((item) => item.status === status);
      }
      if (startTime) {
        filtered = filtered.filter(
          (item) => item.createTime >= (startTime as string),
        );
      }
      if (endTime) {
        filtered = filtered.filter(
          (item) => item.createTime <= (endTime as string),
        );
      }

      const start = (Number(page) - 1) * Number(pageSize);
      const end = start + Number(pageSize);
      const list = filtered.slice(start, end);

      return {
        code: 200,
        message: "success",
        success: true,
        data: {
          list,
          total: filtered.length,
          current: Number(page),
          pageSize: Number(pageSize),
        },
      };
    },
  },

  {
    url: "/api/log/operation/clear",
    method: "DELETE",
    body: () => {
      operationLogs.length = 0;
      return { code: 200, message: "success", success: true };
    },
  },

]);
