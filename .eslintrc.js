module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb/base', 'prettier'],
  env: {
    browser: true,
    commonjs: true,
  },
  plugins: ['prettier', 'babel'],
  settings: {
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.ts'],
      },
    },
    'import/ignore': ['node_modules'],
  },
  rules: {
    'prettier/prettier': 'error',
    'import/extensions': [
      'error',
      'always',
      {
        'js': 'never',
        'ts': 'never',
      }
    ],
    'babel/new-cap': 1,
    'babel/no-invalid-this': 1,
  },
};
