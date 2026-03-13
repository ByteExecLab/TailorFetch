<p align="center">
  <img src="https://i.ibb.co/W6MBLYg/logo-removebg-preview.png"  alt=""/>
</p>

[![Node.js Package](https://github.com/marekdev-me/TailorFetch/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/marekdev-me/TailorFetch/actions/workflows/npm-publish.yml)

# TailorFetch

TailorFetch is a lightweight Node.js library for making HTTP requests with customizable options and response transformations.

> **Warning**
> WIP! Documentation might be outdated or incomplete

## Installation

#### NPM
```bash
npm install tailorfetch 
```

#### CDN
```text
<script src="https://unpkg.com/tailorfetch@1.8.0/umd/tailorfetch.min.js"></script>
```

## Features
 - Simplified HTTP GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS requests
 - Flexible options for headers, query parameters, timeouts, and more
 - Ability to transform response data using custom transformers
 - Ability to intercept request with custom intercept logic
 - Easy-to-use interface for handling common use cases
 - Enables use of Redis or built-in caching

## Usage
### Making GET Request
```typescript
import TailorFetch from 'tailorfetch';

await TailorFetch.GET('https://dummyjson.com/products');
```

### Relative URLs With Per-Request `baseUrl`
```typescript
import TailorFetch from 'tailorfetch';

await TailorFetch.GET('/products', {
   baseUrl: 'https://dummyjson.com'
});
```

### Global `baseUrl` Configuration
```typescript
import TailorFetch from 'tailorfetch';

TailorFetch.configure({
   baseUrl: 'https://dummyjson.com'
});

await TailorFetch.GET('/products');
await TailorFetch.POST('/products/add', {
   body: JSON.stringify({ title: 'BMW Pencil' })
});
```

### Environment-Based `baseUrl` Configuration
In Node.js, TailorFetch will also read `TAILORFETCH_BASE_URL` or `TAILOR_FETCH_BASE_URL`
when `baseUrl` is not supplied in the request or global config.

```bash
TAILORFETCH_BASE_URL=https://dummyjson.com
```

```typescript
import TailorFetch from 'tailorfetch';

await TailorFetch.GET('/products');
```

### Base URL Precedence
TailorFetch resolves relative URLs in this order:
- Request `baseUrl`
- `TailorFetch.configure({ baseUrl })`
- `TAILORFETCH_BASE_URL` or `TAILOR_FETCH_BASE_URL` in Node.js
- `window.location.origin` in the browser

### Making POST Request
```typescript
import TailorFetch from 'tailorfetch';

const url = 'https://dummyjson.com/products/add';
const options = {
    body: JSON.stringify({
      title: 'BMW Pencil'
    }),
};

await TailorFetch.POST(url, options);
```

## Supported Methods:
- `GET`        - Retrieves data or information from a specified resource.
- `POST`       - Submits data to be processed to a specified resource.
- `PUT`        - Updates a specified resource or creates it if it doesn't exist.
- `PATCH`      - Applies partial modifications to a resource.
- `DELETE`     - Deletes a specified resource.
- `HEAD`       - Requests headers from a specified resource without the actual data.
- `OPTIONS`    - Requests information about the communication options for a resource.


## Options:
 - `headers`               -  An object containing request headers.
 - `baseUrl`               -  Base URL used to resolve relative request paths like `/api/users`.
 - `queryParams`           -  An object containing query parameters for the URL.
 - `timeout`               -  The request timeout in milliseconds.
 - `json`                  -  Set to `true` to parse the response as JSON.
 - `body`                  -  Data to be sent to remote server
 - `transformResponse`     -  A custom response transformer.
 - `requestInterceptor`    -  A custom request interceptor
 - `requestMode`
 - `requestCache`
 - `requestCredentials`
 - `onProgress`            -  Callback function for progress reporting
 - `cache`:
   - `expiresIn`           -  How long should cache be valid for (milliseconds)
   - `redisClient`         -  Redis client instance
 - `retry`:
   - `maxRetries`          -  Maximum number of times to attempt to make an HTTP request
   - `retryDelay`          -  Number of milliseconds to wait between attempts

## Global Configuration
- `TailorFetch.configure(config)` - Set global defaults for future requests.
- `TailorFetch.getConfig()` - Read current global defaults.
- `TailorFetch.resetConfig()` - Clear global defaults.

## Concurrent Requests
TailorFetch supports making concurrent HTTP requests out of the box.

```typescript
const responses: TailorResponse[] = await TailorFetch.concurrent([
   {url: 'https://dummyjson.com/products', method: 'GET', options: {name: 'products', json: true}},
   {url: 'https://dummyjson.com/products/1', method: 'GET', options: {name: 'product', json: true}},
   {url: 'https://dummyjson.com/carts', method: 'GET', options: {name: 'carts', json: true}},
]);
```

You can name each request by supplying the `name` option


## Cache

### Built-in cache

> **Warning**
> Built-in cache might be unstable and might return live results at all times

By default, when cache option is specified with only expiry time and no redis client option has been specified then internal cache will be used.

### Redis Cache
You can use Redis cache with GET requests by supplying Redis client to request cache options as follows.

```typescript
import TailorFetch, { TailorResponse } from 'tailorfetch';
import {createClient} from 'redis';

// Setup redis
const client = createClient();
client.on('error', (error) => console.log(error));
client.connect();

// Request options
const options = {
   cache: {
      expiresIn: 600000,
      redisClient: client
   }
};

await TailorFetch.GET('https://dummyjson.com/products/1', options);
```

## Custom Request Interceptor

You can define a custom request transformer by extending the `BaseRequestInterceptor` class and overriding the `intercept` method.
Modify headers, add authentication, or enhance the request before it's sent.

Class based interceptor:
```typescript
import {BaseRequestInterceptor} from 'tailorfetch';

class MyInterceptor implements BaseRequestInterceptor {
   intercept(requestOptions: RequestInit) {
      // Custom intercept logic
      
      return requestOptions;
   }
}

const options = {
   requestInterceptor: new MyInterceptor(),
};

await TailorFetch.GET(url, options);
```

Function based interceptor:
```typescript
import {IRequestOptions} from 'tailorfetch';

const options = {
   requestInterceptor: (requestOptions: RequestInit): RequestInit => {
       
       // Custom request interceptor logic
       return requestOptions;
   },
};

await TailorFetch.GET(url, options);
```

## Custom Response Transformer

You can define a custom response transformer by extending the `BaseTransform` class and overriding the `transform` method.

Class based transformer:
```typescript
import TailorFetch, {BaseTransform, IRequestOptions} from 'tailorfetch';

class MyTransformer implements BaseTransform {
   transform(responseData: any, requestOptions: IRequestOptions) {
      // Custom transformation logic
      return transformedData;
   }
}

const options = {
   transformResponse: new MyTransformer,
};

await TailorFetch.GET(url, options);
```

Function based transformer:
```typescript
import TailorFetch, {BaseTransform, IRequestOptions} from 'tailorfetch';

const options = {
   transformResponse: (responseData: any, requestOptions: IRequestOptions): any => {
      // Custom transformation logic
      return transformedData;
   }
}

await TailorFetch.GET(url, options);
```

## Helper Functions

### `TailorResponse`
Following helper functions are available on `TailorResponse` returned when request is made

   - `json()` - Returns parsed JSON data, only if `parseJSON` request option is false
   - `successful()` - Returns boolean whether request was successful
   - `failed()` - Returns boolean whether request has failed
   - `clientError()` - Returns boolean whether an error was client error
   - `serverError()` - Returns boolean whether an error was server error
