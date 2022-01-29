module.exports = {
  'env': {
    'node': true,
    'es2021': true,
  },
  'plugins': [
    'security-node',
  ],
  'extends': [
    'google',
    'plugin:security-node/recommended',
  ],
  'parser': 'babel-eslint',
  'rules': {
    // Style
    'space-before-function-paren': ['error', 'always'],
    'max-len': ['off'],
    'camelcase': ['off'],
    'no-unused-vars': ['warn'],
    'no-restricted-globals': ['error'],
    'indent': ['error', 2],
    'no-new-wrappers': ['warn'],
    'require-jsdoc': ['off'],
    'no-invalid-this': ['off'],
    'quotes': ['error', 'single', {'avoidEscape': true}],

    // Security
    'security-node/detect-crlf': ['off'],
  },
};
