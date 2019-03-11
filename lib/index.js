'use strict';

// Load modules

const Boom = require('boom');
const Hoek = require('hoek');


// Declare internals

const internals = {};


exports.plugin = {
    pkg: require('../package.json'),
    register: function (server) {

        server.auth.scheme('basic', internals.implementation);
    }
};


internals.implementation = function (server, options) {

    Hoek.assert(options, 'Missing basic auth strategy options');
    Hoek.assert(typeof options.validate === 'function', 'options.validate must be a valid function in basic scheme');

    const settings = Hoek.clone(options);

    const scheme = {
        authenticate: async function (request, h) {

            const authorization = request.headers.authorization;

            if (!authorization) {
                throw Boom.unauthorized(null, 'Basic', settings.unauthorizedAttributes);
            }

            const parts = authorization.split(/\s+/);

            if (parts[0].toLowerCase() !== 'basic') {
                throw Boom.unauthorized(null, 'Basic', settings.unauthorizedAttributes);
            }

            if (parts.length !== 2) {
                throw Boom.badRequest('Bad HTTP authentication header format', 'Basic');
            }

            const credentialsPart = Buffer.from(parts[1], 'base64').toString();
            const sep = credentialsPart.indexOf(':');

            // Changed to allow empty or unset password
            const username = sep === -1 ? credentialsPart : credentialsPart.slice(0, sep);
            const password = sep === -1 ? '' : credentialsPart.slice(sep + 1);

            if (!username &&
                !settings.allowEmptyUsername) {

                throw Boom.unauthorized('HTTP authentication header missing api key (as username)', 'Basic', settings.unauthorizedAttributes);
            }

            const { isValid, credentials, response } = await settings.validate(request, username, password, h);

            if (response !== undefined) {
                return h.response(response).takeover();
            }

            if (!isValid) {
                return h.unauthenticated(Boom.unauthorized('Invalid api key', 'Basic', settings.unauthorizedAttributes), credentials ? { credentials } : null);
            }

            if (!credentials ||
                typeof credentials !== 'object') {

                throw Boom.badImplementation('Bad credentials object received for Basic auth validation');
            }

            return h.authenticated({ credentials });
        }
    };

    return scheme;
};
