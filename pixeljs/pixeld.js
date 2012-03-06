var net = require('net');
var board = {};
var journal = [];

var server = net.createServer(function(socket) {
    console.log("SERVER CONNECTED");
    socket.on("data", function(data) {
        socket.end();
    });
});

server.listen(5607, function() {
    console.log("LISTENING");
});
