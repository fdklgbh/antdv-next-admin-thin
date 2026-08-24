import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('antdv-next', () => ({
  message: {
    error: vi.fn(),
  },
}));

import { service } from '@/utils/request';

const originalAdapter = service.defaults.adapter;

describe('request service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.defaults.adapter = originalAdapter;
  });

  it('exports the axios instance used by request helpers', () => {
    expect(service.defaults.timeout).toBe(15000);
    expect(service.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('does not inject authentication headers or redirect on a public request', async () => {
    let authorizationHeader: unknown;
    service.defaults.adapter = async (config) => {
      authorizationHeader = config.headers?.Authorization;
      throw {
        config,
        request: {},
      };
    };

    await expect(
      service.get('/public', {
        skipErrorMessage: true,
      }),
    ).rejects.toBeDefined();

    expect(authorizationHeader).toBeUndefined();
  });
});
