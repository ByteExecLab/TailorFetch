import IRequestOptions from "./IRequestOptions";
import Request from "./Request";
import TailorResponse from "./Response";
import IGlobalConfig from "./IGlobalConfig";

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CONNECT' | 'HEAD' | 'OPTIONS';

export default class TailorFetch {
    private static globalConfig: IGlobalConfig = {};

    /**
     * Configure library-wide defaults.
     */
    static configure(config: IGlobalConfig): IGlobalConfig {
        TailorFetch.globalConfig = {
            ...TailorFetch.globalConfig,
            ...config,
            headers: {
                ...TailorFetch.globalConfig.headers,
                ...config.headers
            }
        };

        return TailorFetch.getConfig();
    }

    /**
     * Returns current global configuration.
     */
    static getConfig(): IGlobalConfig {
        return {
            ...TailorFetch.globalConfig,
            headers: TailorFetch.globalConfig.headers
                ? { ...TailorFetch.globalConfig.headers }
                : undefined
        };
    }

    /**
     * Reset library-wide defaults.
     */
    static resetConfig(): void {
        TailorFetch.globalConfig = {};
    }

    /**
     * Allow concurrent requests
     *
     * @param requests
     */
    static async concurrent(requests: { url: string; method: RequestMethod, options?: IRequestOptions }[]): Promise<TailorResponse[]> {
        // Map requests to TailorFetch.make calls
        const promises = requests.map((request) =>
            TailorFetch.make(request.url, request.method, request.options)
        );

        // Use Promise.all to wait for all requests to complete
        return Promise.all(promises);
    }

    /**
     * 
     * @param urlStr {string} Url to make request to
     * @param method {string} Request method to make request with
     * @param options {IRequestOptions} Request options
     * 
     * @returns {TailorResponse}
     */
    static async make(urlStr: string, method: RequestMethod, options?: IRequestOptions): Promise<TailorResponse> {
        const request = new Request(urlStr, method, TailorFetch.mergeOptions(options));

        return await request.make();
    }

    /**
     * Make an HTTP GET request
     *
     * @param urlStr {string} Url to make request to
     * @param options {IRequestOptions} Request options to add to request
     * 
     * @returns {TailorResponse}
     */
    static async GET(urlStr: string, options?: IRequestOptions): Promise<TailorResponse> {
        const request = new Request(urlStr, 'GET', TailorFetch.mergeOptions(options));

        return await request.make();
    }


    /**
     * Make an HTTP POST request
     *
     * @param urlStr {string} Url to make request to
     * @param options {IRequestOptions} Request options to add to request
     * 
     * @returns {TailorResponse}
     */
    static async POST(urlStr: string, options?: IRequestOptions): Promise<TailorResponse> {
        const request = new Request(urlStr, 'POST', TailorFetch.mergeOptions(options));

        return await request.make();
    }

    /**
     * Make an HTTP PUT request
     *
     * @param urlStr {string} Url to make request to
     * @param options {IRequestOptions} Request options to add to request
     * 
     * @returns {TailorResponse}
     */
    static async PUT(urlStr: string, options?: IRequestOptions): Promise<TailorResponse> {
        const request = new Request(urlStr, 'PUT', TailorFetch.mergeOptions(options));

        return await request.make();
    }

    /**
     * Make an HTTP PATCH request
     *
     * @param urlStr {string} Url to make request to
     * @param options {IRequestOptions} Options to make request to
     * 
     * @returns {TailorResponse}
     */
    static async PATCH(urlStr: string, options?: IRequestOptions): Promise<TailorResponse> {
        const request = new Request(urlStr, 'PATCH', TailorFetch.mergeOptions(options));

        return await request.make();
    }

    /**
     * Make an HTTP DELETE request
     *
     * @param urlStr {string} Url to make request to
     * @param options {IRequestOptions} Options to add to request
     * 
     * @returns {TailorResponse}
     */
    static async DELETE(urlStr: string, options?: IRequestOptions): Promise<TailorResponse> {
        const request = new Request(urlStr, 'DELETE', TailorFetch.mergeOptions(options));

        return await request.make();
    }

    /**
     * 
     * @param urlStr {string} URL to make a request to 
     * @param options {IRequestOptions} Options to add to request
     * 
     * @returns {TailorResponse} 
     */
    static async HEAD(urlStr: string, options?: IRequestOptions): Promise<TailorResponse> {
        const request = new Request(urlStr, 'HEAD', TailorFetch.mergeOptions(options));

        return request.make();
    }

    /**
     * 
     * @param urlStr {string} URL to make request to
     * @param options {IRequestOptions} Options to add to request
     * 
     * @returns {TailorResponse}
     */
    static async OPTIONS(urlStr: string, options?: IRequestOptions): Promise<TailorResponse> {
        const request = new Request(urlStr, 'OPTIONS', TailorFetch.mergeOptions(options));

        return await request.make();
    }

    private static mergeOptions(options?: IRequestOptions): IRequestOptions {
        const globalConfig = TailorFetch.getConfig();
        const envBaseUrl = TailorFetch.getEnvironmentBaseUrl();

        return {
            ...globalConfig,
            ...options,
            baseUrl: options?.baseUrl ?? globalConfig.baseUrl ?? globalConfig.baseURL ?? envBaseUrl,
            headers: {
                ...globalConfig.headers,
                ...options?.headers
            }
        };
    }

    private static getEnvironmentBaseUrl(): string | undefined {
        if (typeof process === 'undefined' || !process.env) {
            return undefined;
        }

        return process.env.TAILORFETCH_BASE_URL ?? process.env.TAILOR_FETCH_BASE_URL;
    }
}
