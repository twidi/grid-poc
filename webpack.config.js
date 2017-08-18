const path = require('path');
const args = require('minimist')(process.argv.slice(2));

// List of allowed environments
const allowedEnvs = ['dev', 'dist', 'test'];

// Set the correct environment
let currentEnv;
if (args._.length > 0 && args._.indexOf('start') !== -1) {
    currentEnv = 'test';
} else if (args.env) {
    currentEnv = args.env;
} else {
    currentEnv = 'dev';
}
process.env.REACT_WEBPACK_ENV = currentEnv;

// Get available configurations
const configs = {
    base: require(path.join(__dirname, 'cfg/base')),
    dev: require(path.join(__dirname, 'cfg/dev')),
    dist: require(path.join(__dirname, 'cfg/dist')),
    test: require(path.join(__dirname, 'cfg/test'))
};

// Get an allowed environment

/**
 * Get an allowed environment
 *
 * @param {String} env - Environment to get.
 * @returns {string} - Valid environment: `env` is valid, else "dev"
 */
const getValidEnv = (env) => {
    const isValid = env && env.length > 0 && allowedEnvs.indexOf(env) !== -1;
    return isValid ? env : 'dev';
};

/**
 * Build the webpack configuration
 *
 * @param  {String} env - Environment to use
 * @return {Object} - Webpack config for the given env
 */
const buildConfig = env => {
    const usedEnv = getValidEnv(env);
    return configs[usedEnv];
};

module.exports = buildConfig(currentEnv);
