import { vi } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('axios', () => {
    // Factory for axios mock
    console.log('[MOCK SETUP] Initializing axios mock factory');

    // Create the instance mock methods
    const getMock = vi.fn((url) => {
        console.log(`[MOCK EXECUTION] axios.get called with url: ${url}`);
        return Promise.resolve({ data: {} });
    });

    const postMock = vi.fn(() => Promise.resolve({ data: {} }));
    const putMock = vi.fn(() => Promise.resolve({ data: {} }));
    const patchMock = vi.fn(() => Promise.resolve({ data: {} }));
    const deleteMock = vi.fn(() => Promise.resolve({ data: {} }));

    const createInterceptorMock = () => {
        const handlers = [];
        return {
            use: vi.fn((fulfilled, rejected) => {
                const id = handlers.push({ fulfilled, rejected }) - 1;
                return id;
            }),
            eject: vi.fn((id) => {
                if (handlers[id]) handlers[id] = null;
            }),
            handlers: handlers // Expose handlers for testing
        };
    };

    const mockInstance = {
        interceptors: {
            request: createInterceptorMock(),
            response: createInterceptorMock()
        },
        defaults: { headers: { common: {} } },
        get: getMock,
        post: postMock,
        put: putMock,
        patch: patchMock,
        delete: deleteMock
    };

    return {
        default: {
            create: vi.fn(() => {
                console.log('[MOCK EXECUTION] axios.create called');
                return mockInstance;
            }),
            // Default export also needs to act like an instance sometimes
            get: getMock,
            post: postMock,
            put: putMock,
            delete: deleteMock,
            defaults: { headers: { common: {} } }
        }
    };
});
