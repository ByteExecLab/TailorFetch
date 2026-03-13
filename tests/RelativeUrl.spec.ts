import { describe, it } from "mocha";
import { assert } from "chai";
import TailorFetch, { TailorResponse } from "../src";

describe("relative URL handling", () => {
    const originalEnvBaseUrl = process.env.TAILORFETCH_BASE_URL;
    const originalEnvLegacyBaseUrl = process.env.TAILOR_FETCH_BASE_URL;

    it("resolves path-only URLs against options.baseUrl", async () => {
        const originalFetch = globalThis.fetch;
        let requestedUrl: string | undefined;

        globalThis.fetch = (async (input: RequestInfo | URL) => {
            requestedUrl = input.toString();

            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }) as typeof fetch;

        try {
            const response: TailorResponse = await TailorFetch.GET("/api/com", {
                baseUrl: "https://example.com",
                json: true
            });

            assert.equal(requestedUrl, "https://example.com/api/com");
            assert.equal(response.successful(), true);
            assert.deepEqual(response.data, { ok: true });
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    it("resolves path-only URLs against global config", async () => {
        const originalFetch = globalThis.fetch;
        let requestedUrl: string | undefined;

        globalThis.fetch = (async (input: RequestInfo | URL) => {
            requestedUrl = input.toString();

            return new Response(null, { status: 204 });
        }) as typeof fetch;

        TailorFetch.configure({
            baseUrl: "https://global.example.com"
        });

        try {
            const response: TailorResponse = await TailorFetch.GET("/api/com");

            assert.equal(requestedUrl, "https://global.example.com/api/com");
            assert.equal(response.noContent(), true);
        } finally {
            TailorFetch.resetConfig();
            globalThis.fetch = originalFetch;
        }
    });

    it("prefers per-request baseUrl over global config", async () => {
        const originalFetch = globalThis.fetch;
        let requestedUrl: string | undefined;

        globalThis.fetch = (async (input: RequestInfo | URL) => {
            requestedUrl = input.toString();

            return new Response(null, { status: 204 });
        }) as typeof fetch;

        TailorFetch.configure({
            baseUrl: "https://global.example.com"
        });

        try {
            const response: TailorResponse = await TailorFetch.GET("/api/com", {
                baseUrl: "https://request.example.com"
            });

            assert.equal(requestedUrl, "https://request.example.com/api/com");
            assert.equal(response.noContent(), true);
        } finally {
            TailorFetch.resetConfig();
            globalThis.fetch = originalFetch;
        }
    });

    it("resolves path-only URLs against environment config when request and global config are missing", async () => {
        const originalFetch = globalThis.fetch;
        let requestedUrl: string | undefined;

        process.env.TAILORFETCH_BASE_URL = "https://env.example.com";
        delete process.env.TAILOR_FETCH_BASE_URL;

        globalThis.fetch = (async (input: RequestInfo | URL) => {
            requestedUrl = input.toString();

            return new Response(null, { status: 204 });
        }) as typeof fetch;

        try {
            const response: TailorResponse = await TailorFetch.GET("/api/com");

            assert.equal(requestedUrl, "https://env.example.com/api/com");
            assert.equal(response.noContent(), true);
        } finally {
            if (originalEnvBaseUrl === undefined) {
                delete process.env.TAILORFETCH_BASE_URL;
            } else {
                process.env.TAILORFETCH_BASE_URL = originalEnvBaseUrl;
            }

            if (originalEnvLegacyBaseUrl === undefined) {
                delete process.env.TAILOR_FETCH_BASE_URL;
            } else {
                process.env.TAILOR_FETCH_BASE_URL = originalEnvLegacyBaseUrl;
            }

            globalThis.fetch = originalFetch;
        }
    });

    it("merges global headers with request headers", async () => {
        const originalFetch = globalThis.fetch;
        let requestHeaders: Headers | undefined;

        globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
            requestHeaders = init?.headers as Headers;

            return new Response(null, { status: 204 });
        }) as typeof fetch;

        TailorFetch.configure({
            headers: {
                "X-Global": "global",
                "X-Shared": "global"
            }
        });

        try {
            const response: TailorResponse = await TailorFetch.GET("https://example.com/api/com", {
                headers: {
                    "X-Request": "request",
                    "X-Shared": "request"
                }
            });

            assert.equal(requestHeaders?.get("X-Global"), "global");
            assert.equal(requestHeaders?.get("X-Request"), "request");
            assert.equal(requestHeaders?.get("X-Shared"), "request");
            assert.equal(response.noContent(), true);
        } finally {
            TailorFetch.resetConfig();
            globalThis.fetch = originalFetch;
        }
    });

    it("keeps absolute URLs unchanged", async () => {
        const originalFetch = globalThis.fetch;
        let requestedUrl: string | undefined;

        globalThis.fetch = (async (input: RequestInfo | URL) => {
            requestedUrl = input.toString();

            return new Response(null, { status: 204 });
        }) as typeof fetch;

        try {
            const response: TailorResponse = await TailorFetch.GET("https://example.com/api/com");

            assert.equal(requestedUrl, "https://example.com/api/com");
            assert.equal(response.noContent(), true);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
