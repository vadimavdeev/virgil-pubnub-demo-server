const { VirgilCrypto, VirgilAccessTokenSigner } = require('virgil-crypto');
const { JwtGenerator } = require('virgil-sdk');

module.exports = function ({ appId, apiKeyData, apiKeyId }) {
    const virgilCrypto = new VirgilCrypto();
    const accessTokenSigner = new VirgilAccessTokenSigner(virgilCrypto);
    const apiKey = virgilCrypto.importPrivateKey(apiKeyData);
    const jwtGenerator = new JwtGenerator({
        apiKey,
        accessTokenSigner,
        appId: appId,
        apiKeyId: apiKeyId,
        millisecondsToLive: 60 * 1000 // 1 minute
    });

    return jwtGenerator;
}