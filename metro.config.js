const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Supporto per file AVIF e video
config.resolver.assetExts.push('avif', 'mp4', 'mov');

module.exports = config;
