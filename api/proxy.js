/**
 * Compatibility wrapper for Vercel routing.
 *
 * Some deployments end up routing `/api/proxy` to `api/proxy.js` instead of
 * `api/proxy/index.js`. Export the same handler so both are guaranteed to work.
 */
module.exports = require("./proxy/index");

