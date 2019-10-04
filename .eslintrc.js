module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb/base', 'prettier'],
  env: {
    browser: true,
  },
  plugins: ['prettier', 'babel'],
  settings: {
    'import/resolver': 'node',
    'import/ignore': ['node_modules'],
  },
  rules: {
    'prettier/prettier': 'error',
    'import/extensions': [
      'error',
      'ignorePackages',
    ],
    'babel/new-cap': 1,
    'babel/no-invalid-this': 1,
  },
};
