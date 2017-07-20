'use strict';

const express = require('express');
const cfenv = require('cfenv');
const dotenv = require('dotenv');
const JanusGraphClient = require('./JanusGraphClient');

const appEnv = cfenv.getAppEnv();
const app = express();

let snsApiUrl;
let snsApiKey;
let graphId;
let graphClient;

(function() {
    // load from .env
    dotenv.config();
    // load sns variables
    snsApiUrl = process.env.SNS_API_URL;
    if (snsApiUrl.endsWith('/')) {
        snsApiUrl = snsApiUrl.substring(0, snsApiUrl.length - 1);
    }
    snsApiKey = process.env.SNS_API_KEY;
    // create graph client
	graphId = process.env.GRAPH_ID
	graphClient = new JanusGraphClient(
		process.env.JANUSGRAPH_URL,
		process.env.JANUSGRAPH_USERNAME,
		process.env.JANUSGRAPH_PASSWORD
	);
})();

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    res.render('index.ejs', {snsApiUrl: snsApiUrl, snsApiKey: snsApiKey});
});

app.get('/graph/:user', function(req, res) {
    let user = req.params.user;
    let query = `g.V().hasLabel("person").has("name", "${user}").union(outE().inV().hasLabel("ingredient"), outE().inV().hasLabel("cuisine"), outE().inV().outE().inV()).path()`;
    console.log('Querying graph: ' + query);
    graphClient.runGremlinQuery(graphId, `def g = graph.traversal(); ${query}`)
		.then((response) => {
			if (response.result && response.result.data && response.result.data.length > 0) {
				res.send({success: true, data:response.result.data});
			}
			else {
				res.send({success: true, data:[]});
			}
		})
		.catch((error) => {
			res.send({success: false, error: error, data:[]});
		});
});

app.post('/clear', function(req, res) {

});

app.listen(appEnv.port, '0.0.0.0', function() {
  console.log("server starting on " + appEnv.url);
});

require("cf-deployment-tracker-client").track();
