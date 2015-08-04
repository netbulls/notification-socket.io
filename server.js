var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');

app.set('port', (process.env.PORT || 3000));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var pushService = (function () {
	var connections = {};
	return {
		addConnection: function (id, socket) {
			socket.connectionId = id;
			connections[id] = socket;
		},
		removeConnection: function (socket) {
			if (socket.connectionId && connections[socket.conectionId]) {
				delete connections[socket.connectionId];
			}
		},
		pushMessage: function (to, message) {
			if (connections[to]) {
				connections[to].emit('message', message);
			}
		}
	}
}());

io.on('connection', function (socket) {
	socket.on('register', function (username) {
		pushService.addConnection(username, socket);
	});

	socket.on('disconnect', function () {
		pushService.removeConnection(socket);
	});
});

app.post('/api/push', function (req, res) {
	if (req.header('X-AUTH-TOKEN') != process.env['AUTH_TOKEN']) {
		res.status(401).send();
	} else if (req.body.user && req.body.message) {
		pushService.pushMessage(req.body.user, req.body.message);
		res.send();
	}
	else {
		res.status(400).send('Bad Request');
	}
});

app.listen(app.get('port'), function () {
	console.log('Node app is running on port', app.get('port'));
});
