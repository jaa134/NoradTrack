export default {
  '*.{html,css,json,md}': ['prettier --write'],
  '*.{js,ts}': ['eslint --fix --quiet', 'prettier --write'],
  '*.vue': ['eslint --fix --quiet', 'stylelint --fix', 'prettier --write'],
};
