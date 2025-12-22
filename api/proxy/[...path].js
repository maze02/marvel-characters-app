/**
 * Catch-all route for /api/proxy/* so requests like:
 *   /api/proxy/characters/?url=...
 * still resolve to the proxy handler.
 */
module.exports = require("./index");
