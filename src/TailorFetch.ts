import IRequestOptions from "./IRequestOptions";
import Request from "./Request";
import TailorResponse from "./Response";
import IGlobalConfig from "./IGlobalConfig";

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CONNECT' | 'HEAD' | 'OPTIONS';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CONNECT' | 'HEAD' | 'OPTIONS';

export default class TailorFetch {

<<<<<<< HEAD
    private initialConfig: IRequestOptions | null

    constructor(config: IRequestOptions) {
        this.initialConfig = config;
    }

=======
>>>>>>> 07470d7c51d609354684ad7ac90bedfb3a1acfb4
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
        const request = new Request(urlStr, method, { ...options });

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
        const request = new Request(urlStr, 'GET', { ...options });

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
        const request = new Request(urlStr, 'POST', { ...options });

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
        const request = new Request(urlStr, 'PUT', { ...options });

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
        const request = new Request(urlStr, 'PATCH', { ...options });

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
        const request = new Request(urlStr, 'DELETE', { ...options });

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
        const request = new Request(urlStr, 'HEAD', { ...options });

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
        const request = new Request(urlStr, 'OPTIONS', { ...options });

        return await request.make();
    }
}