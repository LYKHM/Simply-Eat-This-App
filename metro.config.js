const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for Clerk package exports
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
