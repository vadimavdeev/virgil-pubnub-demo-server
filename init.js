const fs = require('fs');
const path = require('path');
const tempy = require('tempy');
const inquirer = require('inquirer');
const chalk = require('chalk');

const HEX_REGEXP = /^[0-9a-fA-F]+$/;

const { VirgilCrypto, VirgilCardCrypto } = require('virgil-crypto');
const { VirgilPythiaCrypto } = require('virgil-crypto/dist/virgil-crypto-pythia.cjs');

const { 
    CardManager, 
    VirgilCardVerifier, 
    GeneratorJwtProvider, 
    KeyEntryStorage
} = require('virgil-sdk');
const { createBrainKey } = require('virgil-pythia');
const { SyncKeyStorage } = require('@virgilsecurity/keyknox');

const makeJwtGenerator = require('./makeJwtGenerator');
const virgilCrypto = new VirgilCrypto();

main().catch(err => console.error(chalk.red(err)));

async function main() {
    const answers = await inquirer.prompt([
        { 
            type: 'input',
            name: 'virgil.appId',
            message: 'Enter your Virgil Security Application ID',
            validate: (input => {
                if (HEX_REGEXP.test(input)) {
                    return true;
                }
    
                return 'Invalid Virgil Application ID, must be 32 characters in HEX.';
            })
        },
        {
            type: 'input',
            name: 'virgil.apiKeyData',
            message: 'Enter your Virgil Security API Key private key',
            validate: (input => {
                try {
                    virgilCrypto.importPrivateKey(input);
                } catch (ignore) {
                    return 'The input is not a private key.'
                }
                return true;
            })
        },
        {
            type: 'input',
            name: 'virgil.apiKeyId',
            message: 'Enter your Virgil Security API Key ID',
            validate: (input => {
                if (HEX_REGEXP.test(input)) {
                    return true;
                }
    
                return 'Invalid Virgil API Key ID, must be 32 characters in HEX.';
            })
        },
        {
            type: 'input',
            name: 'demo.userIdentity',
            message: 'Enter user identity',
            default: 'chatengine-demo-e2ee-user'
        },
        {
            type: 'input',
            name: 'demo.brainKeyPassword',
            message: 'Enter password to derive the BrainKey from',
            default: 'PubNubD3m0o'
        }
    ]);

    const jwtGenerator = makeJwtGenerator({
        appId: answers.virgil.appId,
        apiKeyData: answers.virgil.apiKeyData,
        apiKeyId: answers.virgil.apiKeyId
    });
    const jwtProvider = new GeneratorJwtProvider(
        jwtGenerator, 
        undefined, 
        answers.demo.userIdentity
    );

    const { userCard, userKeyPair } = await createUser(jwtProvider);

    await saveUserKey(
        jwtProvider, 
        answers.demo.brainKeyPassword, 
        userKeyPair.privateKey, 
        answers.demo.userIdentity + '-key'
    );

    answers.demo.encryptedChannelKey = getEncryptedKeyForChannel(userKeyPair.publicKey);
    
    const configPath = path.resolve(process.cwd(), '.env2');
    
    fs.writeFileSync(configPath, generateEnvironmentConfig(answers));

    console.log(chalk`
    {bold The server is setup}
    Created User Virgil Card with ID={cyan ${userCard.id}}
    Saved User private key in Keyknox as {cyan ${answers.demo.userIdentity + '-key'}}
    Config written to {cyan ${path.relative(process.cwd(), configPath)}}

    Run {bold npm start} to start the server
    `);
}

async function createUser(jwtProvider) {
    const virgilCardCrypto = new VirgilCardCrypto(virgilCrypto);
    const cardManager = new CardManager({
        cardCrypto: virgilCardCrypto,
        accessTokenProvider: jwtProvider,
        cardVerifier: new VirgilCardVerifier(virgilCardCrypto)
    });
    const userKeyPair = virgilCrypto.generateKeys();
    const userCard = await cardManager.publishCard(userKeyPair);

    return {
        userKeyPair,
        userCard
    };
}

async function saveUserKey(jwtProvider, brainKeyPassword, userPrivateKey, storedKeyName) {
    const brainKey = createBrainKey({
        virgilCrypto,
        virgilPythiaCrypto: new VirgilPythiaCrypto(),
        accessTokenProvider: jwtProvider
    });

    const passwordKeyPair = await brainKey.generateKeyPair(brainKeyPassword);
    
    SyncKeyStorage.create({
        privateKey: passwordKeyPair.privateKey,
        publicKeys: passwordKeyPair.publicKey,
        // Store keys in the operating system's default directory for temporary files
        // because we don't actually need it locally
        keyEntryStorage: new KeyEntryStorage(tempy.directory()),
        accessTokenProvider: jwtProvider
    });

    await syncKeyStorage.sync();
    // stores the user private key encrypted with their password key
    await syncKeyStorage.storeEntry(storedKeyName, virgilCrypto.exportPrivateKey(userPrivateKey));
}

function getEncryptedKeyForChannel(userPublicKey) {
    const channelKeyPair = virgilCrypto.generateKeys();
    const channelPrivateKeyData = virgilCrypto.exportPrivateKey(channelKeyPair.privateKey);
    return virgilCrypto.encrypt(channelPrivateKeyData, userPublicKey);
}

function generateEnvironmentConfig (rootConfig) {
    return Object.entries({
        'VIRGIL_APP_ID': rootConfig.virgil.appId,
        'VIRGIL_API_KEY': rootConfig.virgil.apiKeyData,
        'VIRGIL_API_KEY_ID': rootConfig.virgil.apiKeyId,
        'DEMO_USER_IDENTITY': rootConfig.demo.userIdentity,
        'DEMO_CHANNEL_ENCRYPTED_PRIVATE_KEY': rootConfig.demo.encryptedChannelKey.toString('base64')
    })
    .map(entry => entry.join('='))
    .join('\n');
}