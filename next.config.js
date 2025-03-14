const fs = require("fs");
const path = require("path");

// const withPlugins = require('next-compose-plugins');
// const modules = [
//   'microreact-viewer',
//   "@phylocanvas/phylocanvas.gl",
//   "kepler.gl",
// ]
// const withTM = require('next-transpile-modules')(modules);

function getServerRuntimeConfig() {
  const mergeOptions = require("merge-options");

  const serverRuntimeConfig = require("./defaults.json");

  const configFilePath = process.env.CONFIG_FILE || path.resolve(__dirname, "config.json");
  if (fs.existsSync(configFilePath)) {
    return mergeOptions(serverRuntimeConfig, require(configFilePath));
  }
  else {
    return serverRuntimeConfig;
  }
}

function getPublicRuntimeConfig(serverRuntimeConfig) {
  const packageJson = require("./package.json");

  return {
    version: packageJson.version,
    mapboxApiAccessToken: serverRuntimeConfig.mapboxApiAccessToken,
    downloadActions: serverRuntimeConfig.downloadActions,
    baseUrl: serverRuntimeConfig.baseUrl,
    customShowcase: serverRuntimeConfig.showcaseFolders?.length > 0,
  };
}

const serverRuntimeConfig = getServerRuntimeConfig();
module.exports.serverRuntimeConfig = serverRuntimeConfig;

const publicRuntimeConfig = getPublicRuntimeConfig(serverRuntimeConfig);
module.exports.publicRuntimeConfig = publicRuntimeConfig;

module.exports = ({

  reactStrictMode: true,
  swcMinify: true,

  experimental: {
    // images: { unoptimized: true },
  },

  // Will only be available on the server side
  serverRuntimeConfig,

  // Will be available on both server and client
  publicRuntimeConfig,

  async rewrites() {
    return [
      {
        source: "/accept-invitation/:token",
        destination: "/api/shares/accept",
      },
      {
        source: "/accept/:token",
        destination: "/api/invites/accept",
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/showcase",
        destination: "/",
        permanent: false,
      },
      {
        source: "/myaccount",
        destination: "/my-account",
        permanent: false,
      },
      {
        source: "/api/files/get",
        destination: "/api/files/raw",
        permanent: false,
      },
      {
        source: "/api/files/local",
        destination: "/api/files/raw",
        permanent: false,
      },
    ];
  },

});
