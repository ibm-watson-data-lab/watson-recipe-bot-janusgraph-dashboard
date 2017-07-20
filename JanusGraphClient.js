'use strict';

const rp = require('request-promise');

class JanusGraphClient {

	/**
	 * Creates a new instance of JanusGraphClient.
	 * @param {String} url - JanusGraph url
	 * @param {String} username - JanusGraph username
	 * @param {String} password - JanusGraph password
	 */
	constructor(url, username, password) {
		this.url = url;
		this.username = username;
		this.password = password;
		this.authHeader = 'Basic '+ new Buffer(this.username + ":" + this.password).toString("base64");
	}

	getPostOptions(body) {
		let options = {
			method: 'POST',
			uri: this.url,
			headers: {
				"Authorization": this.authHeader,
				"Content-Type": "application/json"
			},
			json: true,
			body: body
		};
		return options;
	}

	runGremlinQuery(graphId, gremlinQuery) {
		let gremlin = `def graph=ConfiguredGraphFactory.open("${graphId}");`;
		gremlin +=  gremlinQuery;
		return rp(this.getPostOptions({'gremlin': gremlin}))
			.then((responseBody) => {
				if (responseBody.status && responseBody.status.code && responseBody.status.code == 200) {
					return Promise.resolve(responseBody);
				}
				else {
					return Promise.reject(new Error('Invalid status returned from server.'));
				}
			});
	}
}

module.exports = JanusGraphClient;