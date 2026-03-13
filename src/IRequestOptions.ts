import BaseTransform from "./BaseTransform";
import { BufferSource } from "stream/web";
import { createClient } from 'redis';
import BaseRequestInterceptor from "./BaseRequestInterceptor";

type redisClient = ReturnType<typeof createClient>;

export default interface IRequestOptions {
    name?: string,
    baseUrl?: string,
    headers?: { [key: string]: string };
    queryParams?: { [key: string]: string };
    timeout?: number;
    transformResponse?: ((responseData: any, requestOptions: IRequestOptions) => any) | BaseTransform;
    requestInterceptor?: ((requestOptions: RequestInit) => RequestInit) | BaseRequestInterceptor,
    body?: Blob | BufferSource | FormData | URLSearchParams | ReadableStream<Uint8Array> | string | null;
    json?: boolean;
    requestMode?: "navigate" | "same-origin" | "no-cors" | "cors",
    requestCache?: "default" | "no-store" | "reload" | "no-cache" | "force-cache" | "only-if-cached",
    requestCredentials?: "omit" | "same-origin" | "include",
    cache?: {
        expiresIn: number;
        redisClient?: redisClient
    },
    retry?: {
        maxRetries: number;
        retryDelay: number;
    },
    auth?: {
        type: 'basic' | 'digest',
        username: string,
        password: string,
    },
    // proxy?: {
    //     protocol: string,
    //     hostName: string,
    //     port: number
    // }
    onError?: (request: IRequestOptions, response: Response | undefined, error: unknown) => void;
    onProgress?: (loaded: number, total: number, progress: number) => void;
}