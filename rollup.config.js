import includePaths from 'rollup-plugin-includepaths';

const includePathOptions = {
    include: {},
    paths: ['src/'],
    external: [],
    extensions: ['.js', '.json', '.html']
};

export default {
  entry: './src/index.js',
  format: 'cjs',
  dest: './public/index.js',
  sourceMap: true,
  plugins: [ includePaths(includePathOptions) ]
}
