require = require('esm')(module /*, options */ ) // use to handle es6 import/export 
const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;
const config = require('forgae-config');
const { printError } = require('./fs-utils')

const {
    spawn
} = require('promisify-child-process');

const getClient = async function (network, keypair = config.keypair) {
    let client;
    let internalUrl = network.url;

    if (network.url.includes("localhost")) {
        internalUrl = internalUrl + "/internal"
    }

    await handleApiError(async () => {
        client = await Universal({
            url: network.url,
            internalUrl,
            keypair: keypair,
            nativeMode: true,
            networkId: network.networkId,
            compilerUrl: network.compilerUrl
        })
    });

    return client;
}

const getNetwork = (network) => {
    const networks = {
        local: {
            url: config.localhostParams.url,
            networkId: config.localhostParams.networkId
        },
        testnet: {
            url: config.testnetParams.url,
            networkId: config.testnetParams.networkId
        },
        mainnet: {
            url: config.mainnetParams.url,
            networkId: config.mainnetParams.networkId
        }
    };

    const result = networks[network]
    if (!result) {
        throw new Error(`Unrecognized network ${ network }`)
    }

    return result
};


const handleApiError = async (fn) => {
    try {

        return await fn()
    } catch (e) {
        const response = e.response
        logApiError(response && response.data ? response.data.reason : e)
        process.exit(1)
    }
};

function logApiError(error) {
    printError(`API ERROR: ${ error }`)
}

const sleep = (ms) => {
    var start = Date.now();
    while (true) {
        var clock = (Date.now() - start);
        if (clock >= ms) break;
    }
}

const forgaeExecute = async (command, args = [], options = {}) => {
    return execute("forgae", command, args, options)
}

const execute = async (cli, command, args = [], options = {}) => {

    const child = spawn(cli, [command, ...args], options)
    let result = '';

    child.stdout.on('data', (data) => {
        result += data.toString();
    });

    child.stderr.on('data', (data) => {
        result += data.toString();
    });

    await child;
    return result;
};

const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
    config,
    getClient,
    getNetwork,
    handleApiError,
    logApiError,
    sleep,
    forgaeExecute,
    execute,
    timeout
}
