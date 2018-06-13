import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';

export default {
    input: 'src/main.js',
    output: {
        file: './lib/moveImage.min.js',
        format: 'cjs'
    },
    plugins: [
        resolve(),
        commonjs(),
        uglify()
    ]
}