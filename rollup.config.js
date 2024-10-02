import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import typescript from 'rollup-plugin-typescript2';

export default {
    input: 'src/index.js',
    output: {
        file: 'dist/browser/index.js',
        format: 'iife',
        name: 'pdfVisualizer',
        globals: {
            'pdfjs-dist': 'pdfjsLib',
            'feather-icons': 'feather',
            'print-js': 'printJS'
        }
    },
    plugins: [
        resolve({
            browser: true,
        }),
        postcss({
            extensions: ['.css'],
            minimize: true,
            inject: true
        }),
        typescript({
            tsconfig: './tsconfig.json',
        }),
    ],
    external: ['pdfjs-dist', 'feather-icons', 'print-js']
};