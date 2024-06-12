import babel from '@rollup/plugin-babel';
import fs from 'fs';
import filesize from 'rollup-plugin-filesize';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const buildDate = new Date().toString();

const headerLong = `/*!
* ${pkg.name} - ${pkg.description}
* @version ${pkg.version}
* ${pkg.homepage}
*
* @copyright ${pkg.author[0].name}
* @license ${pkg.license}
*
* BUILT: ${buildDate}
*/;`;

const headerShort = `/*! ${pkg.name} v${pkg.version} ${pkg.license}*/;`;

const getBabelConfig = (targets, corejs = false) => babel({
  include: 'src/**',
  babelHelpers: 'runtime',
  babelrc: false,
  presets: [['@babel/preset-env', {
    modules: false,
    targets: targets || pkg.browserslist,
    // useBuiltIns: 'usage'
  }]],
  plugins: [['@babel/plugin-transform-runtime', {
    corejs: corejs,
    helpers: true,
    useESModules: true
  }]]
});

// When few of these get mangled nothing works anymore
// We lose literally nothing by letting these unmangled
const classes = [];

const config = (node, min) => ({
  external: ['@svgdotjs/svg.js'],
  input: 'src/svg.select.js',
  output: {
    file: node ? './dist/svg.select.node.js'
      : min ? './dist/svg.select.min.js'
        : './dist/svg.select.js',
    format: node ? 'cjs' : 'iife',
    name: 'SVG.SelectHandler',
    sourcemap: true,
    banner: headerLong,
    // remove Object.freeze
    freeze: false,
    globals: {
      '@svgdotjs/svg.js': 'SVG'
    }
  },
  treeshake: {
    // property getters have no side effects
    propertyReadSideEffects: false
  },
  plugins: [
    resolve(),
    commonjs(),
    getBabelConfig(node && 'maintained node versions'),
    filesize(),
    !min ? {} : terser({
      mangle: {
        reserved: classes
      },
      output: {
        preamble: headerShort
      }
    })
  ]
});

// [node, minified]
const modes = [[false], [false, true]];

export default modes.map(m => config(...m));
