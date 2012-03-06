var net = require('net');
var board = {};
var journal = [];
var ROWS = 1000;
var COLS = 1200;
var RED = 0, GREEN = 1, BLUE = 2;

var server = net.createServer(function(socket) {
    console.log("SERVER CONNECTED");
    socket.setEncoding("ascii");
    socket.on("data", function(data) {
		parseQuery(data, socket);
        socket.end();
    });
}).listen(5607);

function parseQuery(qry, socket) {
	var single = qry.charAt(0);
	var spaceIndex = qry.indexOf(" ");
    qry = qry.trim();
	
	//get the entire board
	if(single === "g") {
		return getBoard(socket);
	}
	
	//get logs since time
	if(single === "l") {
		if(spaceIndex === -1) return;
		
		var timestamp = qry.substr(spaceIndex + 1);
		return getLogs(+timestamp, socket);
	}
	
	//run the cron
	if(single === "c") {
		return cron(socket);
	}
	
	//no spcae means malformed request
	if(spaceIndex === -1) return;
	
	var pixels = qry.substring(0, spaceIndex).split("|");
	var cmd = qry.substr(spaceIndex + 1).split(" ");
	
	if(cmd[0] === "g") {
		return getPixel(pixels, socket);
	}
	
	//write pixels
	if(cmd[0] === "w") {
		saveLog(qry, cmd[4]);
		return writePixel(pixels, cmd);
	}
	
	//set meta-data
	if(cmd[0] === "m") {
		return setMetaData(pixels, cmd);
	}
	
	//delete pixels
	if(cmd[0] === "d") {
		saveLog(qry, cmd[1]);
		return deletePixel(pixels);
	}
}

function getBoard(socket) {
	var pixel;
	
	for(var x = 0; x < COLS; ++x) {
		for(var y = 0; y < ROWS; ++y) {
			pixel = board[x + "," + y];
			
			if(pixel) {
				socket.write(pixel.color + pixel.price + pixel.owner);
			} else {
				socket.write(".");
			}
		}
	}
}

function cron(socket) {
	var pixel;
	var modified = {};
	var owners = {};
	
	//directions of neighbouring pixels
	var circle = [
		[-1, -1],
		[-1,  0],
		[-1,  1],
		[ 0, -1],
		[ 0,  1],
		[ 1, -1],
		[ 1,  0],
		[ 1,  1]
    ];
	
	for(var x = 0; x < COLS; ++x) {
		for(var y = 0; y < ROWS; ++y) {
			pixel = board[x + "," + y];
			
			if(!pixel) continue;
			
			var r = parseInt(pixel.color.substr(0, 2), 16);
			var g = parseInt(pixel.color.substr(2, 2), 16);
			var b = parseInt(pixel.color.substr(4, 2), 16);
			
			var dominant = getDominant(r, g, b);
			
			for(var k = 0; k < 8; ++k) {
				var row = x + circle[k][0];
				var col = y + circle[k][1];
				var odds = 0;
				
				if(row < 0 || col < 0 || col >= COLS || row >= ROWS) continue;
				
				var opp = board[col + "," + row];
				
				if(!opp || opp.owner === pixel.owner) continue;
				
				var or = parseInt(opp.color.substr(0, 2), 16);
				var og = parseInt(opp.color.substr(2, 2), 16);
				var ob = parseInt(opp.color.substr(4, 2), 16);
				
				var odominant = getDominant(or, og, ob);
				
				if((dominant == RED && odominant == GREEN) ||
				   (dominant == GREEN && odominant == BLUE) ||
				   (dominant == BLUE && odominant == RED))
				
					odds += 600;
					
				//boost odds for brighter colors
				if(dominant == RED) {
					odds += ~~((r - g) + (r - b)) / 5;
				} else if(dominant == GREEN) {
					odds += ~~((g - r) + (g - b)) / 5;
				} else if(dominant == BLUE) {
					odds += ~~((b - r) + (b - g)) / 5;
				}
				
				//winner
				if(rand(0, 1000) < odds) {
					modified[col + "," + row] = pixel.owner;
					
					if(!owners[pixel.owner]) owners[pixel.owner] = {win: 0, lose: 0};
					if(!owners[opp.owner]) owners[opp.owner] = {win: 0, lose: 0};
					
					owners[pixel.owner].win++;
					owners[opp.owner].lose++;
				}
			}
		}
	}
	
	//copy ownership at the end
	for(var pix in modified) {
		board[pix].owner = modified[pix].owner;
	}
	
	//build summary
	var summary = "";
	for(var own in owners) {
		summary += own + "," + owners[own].win + "," + owners[own].lose + "|";
	}
	
	socket.write(summary.substring(0, summary.length - 1));
}

function rand(min, max) {
	var range = max - min + 1;
	return Math.floor(Math.random() * range + min);
}

function getDominant(r, g, b) {
	if(r > g && r > b) return RED;
	if(g > r && g > b) return GREEN;
	if(b > r && b > g) return BLUE;
	
	if(r == g && r == b) return rand(0, 2);
	if(r == g) return rand(0, 1) ? RED : GREEN;
	if(r == b) return rand(0, 1) ? RED : BLUE;
	if(g == b) return rand(0, 1) ? GREEN : BLUE;
	
	return RED;
}

function getLogs(timestamp, socket) {
	var count = 0;
	
    //too much data to transmit
    if(journal.length > 100) {
        socket.write(".");
        return;
    }

	for(var i = 0; i < journal.length; ++i) {
		if(journal[i].timestamp >= timestamp) {
			socket.write(journal[i] + "\n");
			count++;
		}
	}
	
	//write empty string
	if(count == 0) {
		socket.write("");
	}
}

function saveLog(qry, timestamp) {
	if(journal.length > 100) {
		journal = [];
	}
	
	journal.push({timestamp: +timestamp, qry: qry});
	journal.sort(function(a,b) { return a.timestamp - b.timestamp; });
}

function getPixel(pixels, socket) {
	var pixel;
    console.log("GET", pixels);	
	for(var i = 0; i < pixels.length; ++i) {
		pixel = board[pixels[i]];
		
		if(pixel) {
			socket.write(pixel.color + pixel.price + pixel.owner);
		} else {
			socket.write(".");
		}
	}
}

function writePixel(pixels, cmd, socket) {
    console.log("WRITE", pixels, cmd);
	for(var i = 0; i < pixels.length; ++i) {
		board[pixels[i]] = {
			color: cmd[1],
			price: cmd[2],
			owner: cmd[3]
		};
	}
}

function getMetaData(pixel, name) {
	var pix = board[pixel];
	if(!pix) return;
	return pix[name];
}

function setMetaData(pixels, cmd) {
	var pixel;
    console.log("META", pixels, cmd);
	
	for(var i = 0; i < pixels.length; ++i) {
		pixel = board[pixels[i]];
		
		if(!pixel) continue;
		
		pixel[cmd[1]] = cmd[2];
	}
}

function deletePixel(pixels) {
	for(var i = 0; i < pixels.length; ++i) {
		delete board[pixels[i]];
	}
}
