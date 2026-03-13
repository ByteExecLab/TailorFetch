import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
    input: 'lib/index.js', // Entry point of TailorFetch
    output: [
        {
            file: 'umd/tailorfetch.min.js',
            format: 'umd', // Universal Module Definition (UMD) for browsers and Node.js
            name: 'TailorFetch', // Global variable name in browsers
        },
        {
            file: 'umd/tailorfetch.esm.js',
            format: 'es', // ES Module format
        },
    ],
    plugins: [
        resolve(), // Resolves Node.js modules for browser compatibility
        commonjs(), // Converts CommonJS modules to ES modules
        terser(), // Minifies the bundle
    ],
};
