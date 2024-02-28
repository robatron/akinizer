const path = require('path');
const configUtils = require('../configUtils');
const { DEFAULT_CONFIGS } = require('../constants');

const baseFixtureDir = path.join(
    __dirname,
    '__fixtures__',
    'configUtils.test.js',
);

describe('configUtils', () => {
    it('returns the default config if no config file is found', () => {
        const configFilePath = path.join(
            baseFixtureDir,
            'non-existent-config-file',
        );
        const expected = DEFAULT_CONFIGS;
        const actual = configUtils.getConfig({
            searchPlaces: [configFilePath],
            stopDir: baseFixtureDir,
        });
        expect(actual).toStrictEqual(expected);
    });

    it('merges new config items with default config', () => {
        const configFilePath = path.join(baseFixtureDir, 'new-configs.js');
        const expected = { ...DEFAULT_CONFIGS, ...require(configFilePath) };
        const actual = configUtils.getConfig({
            searchPlaces: [configFilePath],
            stopDir: baseFixtureDir,
        });
        expect(actual).toStrictEqual(expected);
    });

    it('merges updated config items with default config', () => {
        const configFilePath = path.join(baseFixtureDir, 'updated-configs.js');
        const expected = require(configFilePath);
        const actual = configUtils.getConfig({
            searchPlaces: [configFilePath],
            stopDir: baseFixtureDir,
        });
        expect(actual).toStrictEqual(expected);
        expect(actual).toMatchInlineSnapshot(`
            {
              "binInstallDir": "foo",
              "gitCloneDir": "bar",
            }
        `);
    });
});
