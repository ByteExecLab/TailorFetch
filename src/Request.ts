import IRequestOptions from "./IRequestOptions";
import Cache from "./Cache";
import TailorResponse from "./Response";
import NetworkError from "./errors/NetworkError";
import ConnectionTimeoutError from "./errors/ConnectionTimeoutError";

export default class Request {

	/**
	 * Url of the remote server to make request to
	 *
	 * @private
	 */
	private readonly urlStr: string;

	/**
	 * HTTP method to use for request
	 *
	 * @private
	 */
	private readonly method: string;

	/**
	 * Request options to add to request
	 *
	 * @private
	 */
	private readonly requestOptions: IRequestOptions;

	/**
	 * Signal to be used for cancellation
	 *
	 * @private
	 */
	private readonly abortSignal: AbortSignal | undefined;

	/**
	 * Request response
	 *
	 * @private
	 */
	private response!: Response;

	/**
	 * Attempts count
	 *
	 * @private
	 */
	// private retryCount = 0;

	constructor(urlStr: string, method: string, requestOptions: IRequestOptions, signal?: AbortSignal) {
		this.urlStr = urlStr;
		this.method = method;
		this.requestOptions = requestOptions;
		this.abortSignal = signal;
	}

	/**
	 * Make an HTTP response to remote URL
	 * 
	 * @returns {TailorResponse}
	 */
	async make(): Promise<TailorResponse> {
		const requestOptionsObject = this.buildRequestOptions();

		try {
			this.response = await fetch(this.urlStr, requestOptionsObject);

			if (this.requestOptions.onProgress && this.response.body) {
				return await this.handleProgress(this.response);
			}

			return await this.handleResponse(this.response);

		} catch (error) {
			if (this.shouldRetry(error)) {
				return await this.retry();
			}

			if (this.requestOptions.onError) {
				this.requestOptions.onError(this.requestOptions, this.response, error);
			}

			return new TailorResponse(undefined, this.response, this.requestOptions);
		}
	}

	/**
	 * Build request options object
	 * 
	 * @returns {RequestInit}
	 */
	private buildRequestOptions(): RequestInit {
		const requestOptionsObject: RequestInit = {
			method: this.method,
			headers: this.setHeaders(),
			mode: this.requestOptions.requestMode,
			body: this.requestOptions.body,
			cache: this.requestOptions.requestCache,
			credentials: this.requestOptions.requestCredentials,
			signal: this.abortSignal
		};

		// Intercept request
		if (this.requestOptions.requestInterceptor) {
			let modifiedRequestOptions;
			if (typeof this.requestOptions.requestInterceptor === 'function') {
				modifiedRequestOptions = modifiedRequestOptions = this.requestOptions.requestInterceptor(requestOptionsObject);
			} else {
				modifiedRequestOptions = modifiedRequestOptions = this.requestOptions.requestInterceptor.intercept(requestOptionsObject);
			}
			Object.assign(requestOptionsObject, modifiedRequestOptions);
		}

		return requestOptionsObject;
	}

	/**
	 * Handle request processing progress reporting
	 *
	 *
	 * @returns {TailorResponse}
	 * @param response
	 */
	private async handleProgress(response: Response): Promise<TailorResponse> {
		const contentLengthHeader = response.headers.get('Content-Length');

		if (response.body && contentLengthHeader) {
			const reader = response.body.getReader();
			let loadedBytes = 0;
			let totalBytes = parseInt(contentLengthHeader, 10);

			const progressCallback = this.requestOptions.onProgress;

			const controller = new ReadableStream({
				async start(controller) {
					while (true) {
						const { done, value } = await reader.read();

						if (done) {
							controller.close();
							break;
						}

						loadedBytes += value?.length || 0;

						if (progressCallback) {
							// Calculate and report progress as a percentage
							const progress = (loadedBytes / totalBytes) * 100;
							progressCallback(loadedBytes, totalBytes, progress);
						}

						controller.enqueue();
					}
				}
			});

			// Continue processing the response
			return await this.handleReadableStreamResponse(controller);
		}

		return new TailorResponse(undefined, response, this.requestOptions);
	}

	/**
	 * Handle readable stream response
	 * 
	 * @param response {ReadableStream}
	 * 
	 * @returns {Promise<TailorResponse>} 
	 */
	private async handleReadableStreamResponse(response: ReadableStream): Promise<TailorResponse> {
		// Read the response body as a string
		const responseAsString = await this.readResponseBodyAsString(response);

		// Apply transformation if a transform is provided
		if (this.requestOptions.transformResponse) {
			let transformedResponse;

			// FIXME: Simplify me
			if (typeof this.requestOptions.transformResponse === 'function') {
				transformedResponse =
					this.requestOptions.transformResponse(this.transformResponse(responseAsString), this.requestOptions);
			} else {
				transformedResponse =
					this.requestOptions.transformResponse.transform(this.transformResponse(responseAsString), this.requestOptions);
			}

			return new TailorResponse(transformedResponse, this.response, this.requestOptions);
		}

		return new TailorResponse(responseAsString, this.response, this.requestOptions);
	}

	/**
	 * @param responseAsString {string}
	 * 
	 * @returns {string} 
	 */
	private transformResponse(responseAsString: string): string {
		if (this.requestOptions.json) {
			return JSON.parse(responseAsString);
		}

		return responseAsString;
	}

	/**
	 * 
	 * @param body {ReadableStream}
	 * 
	 * @returns {Promise<string>}
	 */
	private async readResponseBodyAsString(body: ReadableStream): Promise<string> {
		const reader = body.getReader();
		let text = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			text += new TextDecoder().decode(value);
		}

		return text;
	}

	/**
	 * Handle incoming HTTP request
	 *
	 * @param response { Response } HTTP response received from remote server
	 *
	 * @private
	 */
	private async handleResponse(response: Response): Promise<TailorResponse> {

		// Generate the cache key
		const cacheKey = Cache.generateCacheKey(this.method, this.urlStr.toString(), this.requestOptions);

		// Try to get the response from cache (if it's a GET request and caching is enabled)
		if (this.method === 'GET' && this.requestOptions.cache) {
			const cachedResponse = await Cache.get(cacheKey, this.requestOptions);
			if (cachedResponse) {
				return new TailorResponse(cachedResponse, response, this.requestOptions, true);
			}
		}

		// Fetch response
		const responseBody = response.body ? await response.text() : undefined;

		// Transform the response if transform is provided
		if (this.requestOptions.transformResponse) {

			let transformedResponse;
			const body = this.requestOptions.json && responseBody ? JSON.parse(responseBody) : responseBody;

			// FIXME: Simplify me
			if (typeof this.requestOptions.transformResponse === 'function') {
				transformedResponse =
					this.requestOptions.transformResponse(body, this.requestOptions);
			} else {
				transformedResponse =
					this.requestOptions.transformResponse.transform(body, this.requestOptions);
			}


			// Cache the transformed response (if caching is enabled)
			if (this.requestOptions.cache) {
				Cache.set(cacheKey, transformedResponse, this.requestOptions, this.requestOptions.cache.expiresIn);
			}

			return new TailorResponse(transformedResponse, this.response, this.requestOptions);
		}

		// If no transform function is provided, parse JSON (if json option is enabled)
		if (this.requestOptions.json && responseBody) {
			const jsonResponse = JSON.parse(responseBody);

			// Cache the JSON response (if caching enabled)
			if (this.requestOptions.cache) {
				Cache.set(cacheKey, jsonResponse, this.requestOptions, this.requestOptions.cache.expiresIn);
			}

			return new TailorResponse(jsonResponse, this.response, this.requestOptions);
		}

		// Cache the original response if caching is enabled
		if (this.requestOptions.cache) {
			Cache.set(cacheKey, responseBody, this.requestOptions, this.requestOptions.cache.expiresIn);
		}

		// Return the original or transformed response
		return new TailorResponse(responseBody, this.response, this.requestOptions);
	}


	private shouldRetry(error: any): boolean {
		// Determine if a retry should be attempted based on the error type or specific conditions.
		if (error instanceof NetworkError) {
			// Retry for network errors like connection issues.
			return true;
		}

		return error instanceof ConnectionTimeoutError;
	}

	private async retry(): Promise<TailorResponse> {
		const maxRetries = this.requestOptions.retry?.maxRetries || 0;
		const retryDelay = this.requestOptions.retry?.retryDelay || 0;

		for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
			try {
				const response = await this.make();

				if (response && response.successful()) {
					return response;
				}

			} catch (error) {
				// ERROR
			}

			if (retryDelay) {
				await this.sleep(retryDelay);
			}
		}

		// If all retries fail, return an appropriate response or handle it accordingly.
		return new TailorResponse(undefined, this.response, this.requestOptions);
	}


	/**
	 * Delay request when attempting after failed request
	 *
	 * @param delay { number } Number of milliseconds to sleep for
	 *
	 * @private
	 */
	private sleep(delay: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, delay));
	}

	/**
	 * Set a request headers
	 *
	 * @private
	 */
	private setHeaders(): HeadersInit {
		const requestHeaders = new Headers();

		if (this.requestOptions.headers) {

			// Add an authentication headers
			if (this.requestOptions.auth) {
				const { type, username, password } = this.requestOptions.auth;

				switch (type) {
					case "basic": {
						requestHeaders.set('Authorization', `Basic ${btoa(`${username}:${password}`)}`);
						break;
					}
					case "digest": {
						throw new Error("Not yet implemented");
					}
				}
			}

			// Add rest of the headers supplied by user
			for (const key in this.requestOptions.headers) {
				requestHeaders.set(key, this.requestOptions.headers[key]);
			}
			return requestHeaders;
		}

		return requestHeaders;
	}
}