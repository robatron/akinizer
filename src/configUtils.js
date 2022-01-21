const { cosmiconfigSync } = require('cosmiconfig');
const { name: moduleName } = require('../package.json');
const { DEFAULT_CONFIGS } = require('./constants');
const log = require('./log');

/**
 * Return the config object from the config file (e.g., `.akinizerrc.js`)
 * merged with the default configs, i.e., default configs will be used unless
 * overridden by the config file. See `cosmiconfigOptions` for default config
 * file seach locations:
 * https://github.com/davidtheclark/cosmiconfig#cosmiconfigoptions
 */
const getConfig = (ccOpts) => {
    const explorerSync = cosmiconfigSync(moduleName, ccOpts);

    // result.config is the parsed configuration object.
    // result.filepath is the path to the config file that was found.
    // result.isEmpty is true if there was nothing to parse in the config file.
    const result = explorerSync.search();

    let configs = DEFAULT_CONFIGS;

    // If no config files are found, just return the default configs
    if (!result) log.info('No config files found. Using defaults.');
    else configs = { ...configs, ...result.configs };

    log.info('Configuration:', { configs });

    return configs;
};

module.exports = {
    getConfig,
};
