import { vi } from 'vitest';

const mockAxios = {
    create: vi.fn(() => ({
        interceptors: {
            request: { use: vi.fn(), eject: vi.fn() },
            response: { use: vi.fn(), eject: vi.fn() }
        },
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        defaults: { headers: { common: {} } }
    })),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    defaults: { headers: { common: {} } },
    AxiosError: class extends Error {
        constructor(message, code, config, request, response) {
            super(message);
            this.code = code;
            this.config = config;
            this.request = request;
            this.response = response;
            this.isAxiosError = true;
        }
    }
};

export default mockAxios;
