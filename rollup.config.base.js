import jscc from 'rollup-plugin-jscc'
import typescript from 'rollup-plugin-typescript'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify'
import ascii from 'rollup-plugin-ascii'

export default function config(options) {
  return {
    entry: 'src/app.ts',
    plugins: [
      jscc({ extensions: ['.ts'], values: { _DEBUG: !options.minify } }),
      typescript({ typescript: require('typescript') }),
      nodeResolve({ jsnext: true, browser: true, extensions: ['.js', '.ts'] }),
      commonjs({ include: 'node_modules/**' })
    ].concat(options.minify ? [uglify()] : [])
     .concat([ascii()]),
    external: ['phaser-ce'],
    globals: {
      'phaser-ce': 'Phaser'
    },
    dest: 'www/js/app.js',
    format: 'iife',
    sourceMap: true
  }
}