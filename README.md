### hapi-auth-basic-key

Fork of [hapi-auth-basic](http://travis-ci.org/hapijs/hapi-auth-basic) that is intended to handle API keys as the 
username field of HTTP basic auth requests. The password portion of the authorization is available, but not necessary.


Basic authentication requires validating a username and password combination. The `'basic'` scheme takes the following options:

- `validateFunc` - (required) a user lookup and password validation function with the signature `function(request, username, password, callback)` where:
    - `request` - is the hapi request object of the request which is being authenticated.
    - `username` - the username (api key) received from the client.
    - `password` - the password received from the client. Not necessarily required unless you want it to be.
    - `callback` - a callback function with the signature `function(err, isValid, credentials)` where:
        - `err` - an internal error.
        - `isValid` - `true` if both the username was found and the password matched, otherwise `false`.
        - `credentials` - a credentials object passed back to the application in `request.auth.credentials`. Typically, `credentials` are only
          included when `isValid` is `true`, but there are cases when the application needs to know who tried to authenticate even when it fails
          (e.g. with authentication mode `'try'`).
- `allowEmptyUsername` - (optional) if `true`, allows making requests with an empty username. Defaults to `false`.
- `unauthorizedAttributes` - (optional) if set, passed directly to [Boom.unauthorized](https://github.com/hapijs/boom#boomunauthorizedmessage-scheme-attributes). Useful for setting realm attribute in WWW-Authenticate header. Defaults to `undefined`.

```javascript

const keys = {
    super_secret_api_key: {
        id: '2133d32a',
        name: 'my really cool app'
    }
};

const validate = function (request, username, password, callback) {

    const key = keys[username];
    if (!key) {
        return callback(null, false);
    } 

    callback(err, true, key);
};

server.register(require('hapi-auth-basic-key'), (err) => {

    server.auth.strategy('simple', 'basic', { validateFunc: validate });
    server.route({ method: 'GET', path: '/', config: { auth: 'simple' } });
});
```