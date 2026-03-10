const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    buffer: path.resolve(__dirname, 'node_modules/buffer'),
    process: path.resolve(__dirname, 'node_modules/process'),
    stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
    events: path.resolve(__dirname, 'node_modules/events'),
};

config.resolver.blockList = [
    ...Array.from(config.resolver.blockList || []),
    /\/contracts\/.*/,
    /\/scripts\/.*/,
    /\/artifacts\/.*/,
    /\/test\/.*/,
    /\/typechain-types\/.*/,
];

module.exports = config;
