import { defineMock } from 'vite-plugin-mock-dev-server';

import { sysFiles } from '../data/file.data';

export default defineMock([
  {
    url: '/api/file/list',
    method: 'GET',
    body: (req) => {
      const { name, ext, storage, page = 1, pageSize = 20 } = req.query;
      let filtered = [...sysFiles];

      if (name) filtered = filtered.filter((item) => item.originalName.includes(name as string));
      if (ext) filtered = filtered.filter((item) => item.ext === ext);
      if (storage) filtered = filtered.filter((item) => item.storage === storage);

      const start = (Number(page) - 1) * Number(pageSize);
      const list = filtered.slice(start, start + Number(pageSize));

      return {
        code: 200,
        message: 'success',
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
    url: '/api/file/:id',
    method: 'GET',
    body: (req) => {
      const file = sysFiles.find((item) => item.id === req.params.id);
      if (!file) return { code: 404, message: '文件不存在', success: false };
      return { code: 200, message: 'success', success: true, data: file };
    },
  },

  {
    url: '/api/file/upload',
    method: 'POST',
    body: (req) => {
      const { originalName, size, mimeType, storage = 'local' } = req.body;

      if (!originalName) {
        return { code: 400, message: '文件名不能为空', success: false };
      }

      const ext = originalName.includes('.') ? originalName.split('.').pop() : '';
      const newFile = {
        id: `file-${Date.now()}`,
        originalName,
        storedName: `${Date.now()}-${originalName}`,
        size: size || 0,
        ext: ext || '',
        mimeType: mimeType || 'application/octet-stream',
        storage,
        url: `/uploads/${Date.now()}-${originalName}`,
        uploader: 'admin',
        uploadTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };

      sysFiles.unshift(newFile);

      return {
        code: 200,
        message: '上传成功',
        success: true,
        data: newFile,
      };
    },
  },

  {
    url: '/api/file/:id',
    method: 'DELETE',
    body: (req) => {
      const index = sysFiles.findIndex((item) => item.id === req.params.id);
      if (index === -1) return { code: 404, message: '文件不存在', success: false };
      sysFiles.splice(index, 1);
      return { code: 200, message: '删除成功', success: true };
    },
  },
]);
