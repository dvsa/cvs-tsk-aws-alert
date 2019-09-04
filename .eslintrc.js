module.exports = {
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    extends: [
        'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin,
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended',
        'plugin:jsdoc/recommended',
    ],
    env: { es6: true },
    parserOptions: {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
        ecmaFeatures: {
            impliedStrict: true,
        },
    },
    rules: {
        'max-len': ['error', { code: 240 }],
        'new-parens': 'off',
        'no-caller': 'error',
        'no-bitwise': 'off',
        'no-cond-assign': 'off',
        'no-multiple-empty-lines': 'off',
        'no-console': 'off',
        'sort-keys': 'off',
        'sort-imports': 'off',
    },
};
