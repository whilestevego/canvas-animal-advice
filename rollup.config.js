import includePaths from 'rollup-plugin-includepaths';

const includePathOptions = {
    include: {},
    paths: ['src/utils'],
    external: [],
    extensions: ['.js', '.json', '.html']
};

export default {
  entry: './src/index.js',
  format: 'cjs',
  dest: './build/index.js',
  sourceMap: true,
  plugins: [ includePaths(includePathOptions) ]
}
