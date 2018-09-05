# Backend for PubNub demo chat app end-to-end-encrypted with Virgil

Important! This server is intended for demo purposes only. Do NOT use it as a basis of your web applications.

This server serves two purposes:
* Generate JWTs for authentication in Virgil APIs. Always issues JWT with the same Subject (i.e. user identity) specified in `DEMO_USER_IDENTITY` environment variable. In a real app, the Subject of JWT must be unique for every user.
* Provide the encrypted private key of the Chat Channel which is used to decrypt messages in the channel. Always returns the same base64 encoded encrypted key specified in `DEMO_CHANNEL_ENCRYPTED_PRIVATE_KEY` environment variable. 

## Deployment

### Pre-requisites

* Ensure you have [Node.js](https://nodejs.org/en/) >= 8 installed
* Create a free [Virgil Security](https://dashboard.virgilsecurity.com/) account

### Setup instructions
* Clone this Node sample server repo to your disk and step into the project's folder
	```sh
	git clone https://github.com/vadimavdeev/virgil-pubnub-demo-server.git
	cd virgil-pubnub-demo-server
	```
* Install dependencies and run setup. The set setup will ask you a few questions...
    ```sh
	npm install
	npm run setup
	```
* To provide the first input, create an **END-TO-END ENCRYPTION** Application in the Virgil Security [Dashboard](https://dashboard.virgilsecurity.com/apps/new) and copy the APP ID here:
	```sh
	? Enter your Virgil Security Application ID [paste Virgil APP ID here]
	```
	
* Go back to the Virgil Dashboard [API Keys page and create one](https://dashboard.virgilsecurity.com/api-keys), it will be copied to your clipboard.
	```sh
	? Enter your Virgil Security API Key private key [paste it here]
	```

* Now, on the Virgil API keys page, find your new API key in the list and copy its API KEY ID.  
	```sh
	? Enter your Virgil Security API Key ID [paste it here]
	```
* Now the Virgil node backend server is ready to start:
	```sh
	npm start
	```
* You can test it at http://localhost:3000

## Endpoints

### GET /virgil-jwt
Generates and returns a JWT to use for authentication in Virgil APIs. Returns the JWT as `text/plain`.
The JWT's Subject is always the specified in `DEMO_USER_IDENTITY` environment variable.

### GET /channel-private-key
Returns the private key of the chat channel encrypted with user's public key. Returns the key in base64 encoding as `text/plain`. The value is the one specified in `DEMO_CHANNEL_ENCRYPTED_PRIVATE_KEY` environment variable.