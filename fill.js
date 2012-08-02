var net = require("net");

function zeroPad(number, width) {
  width -= number.toString().length;
  if (width > 0) {
    return new Array(width + 1).join('0') + number;
  }
  return number + ""; // always return a string
}

var socket = net.createConnection(5607, function() {
	var req = "";
	for(var i = 0; i < 1000; ++i) {
		req += (Math.random() * 1200 | 0) + "," +
					 (Math.random() * 1000 | 0) + "|";
	}

	req = req.substring(0, req.length - 1);
	var color = zeroPad(Math.random() * 0xFFFFFF | 0, 6);

	req += " w " + color + " 1f4 1 9999999999";
	socket.end(req);
});
