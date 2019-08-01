module.exports = {
    testMatch: ['**/+(*.)+(spec|test).+(ts)?(x)'],
    roots: ['<rootDir>/test'],
    moduleFileExtensions: ['ts', 'js'],
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
};
