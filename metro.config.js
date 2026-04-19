const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Supporto per file AVIF
config.resolver.assetExts.push('avif');

module.exports = config;
