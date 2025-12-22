/**
 * Catch-all route for /api/proxy/* so requests like:
 *   /api/proxy/characters/?url=...
 * still resolve to the proxy handler.
 */
const handler = require("./index");

module.exports = async (req, res) => handler(req, res);
