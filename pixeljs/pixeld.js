var net = require('net');
var fs 	= require('fs');

var board 	= [];
var journal = [];

var ROWS = 1000;
var COLS = 1200;

var RED 	= 0, 
		GREEN = 1, 
		BLUE 	= 2;

var server = net.createServer(function(socket) {
    console.log("SERVER CONNECTED");
    socket.setEncoding("ascii");
    socket.on("data", function(data) {
			parseQuery(data, socket);
			socket.end("\n");
    });
}).listen(5607);

initBoard();

function zeroPad(number, width) {
  width -= number.toString().length;
  if (width > 0) {
    return new Array(width + 1).join('0') + number;
  }
  return number + ""; // always return a string
}

function initBoard() {
	//create board objects
	for(var x = 0; x < COLS; ++x) {
		if(!board[x]) board[x] = [];

		for(var y = 0; y < ROWS; ++y) {
			board[x][y] = {
				owner: null,
				color: null,
				price: 10
			}
		}
	}

	//if the board file exists, import it
	if(fs.existsSync("board.js")) {
		fs.readFile("board.js", function(err, out) {
			out = out.toString();
			readBoard(out.substring(22, out.length - 3));
		});
	} else {
		//else save the state to a file
		saveState();
	}
}

function readBoard(parse) {
  var len = parse.length;
  var x = 0, y = 0;
  var params = {};
 
  for(var i = 0; i < len; i++) {
    if(parse.charAt(i) === '') break;

    if(x == 1200) {
      x = 0;
      y++;
    }

    if(parse.charAt(i) === '.') {
      x++;
      continue;
    }

    var key = board[x][y];

    key.color = parse.substr(i, 6);
    key.price = parse.substr(i + 6, 3);
    key.owner = parse.substr(i + 9, 4);     
		console.log(key);
    x++;
    i += 12;
  }
}

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
	var buffer = "";
	
	for(var y = 0; y < ROWS; ++y) {
		for(var x = 0; x < COLS; ++x) {
			pixel = board[x][y];
			
			if(pixel && pixel.owner !== null) {
				buffer += pixel.color + zeroPad(pixel.price, 3) + zeroPad(pixel.owner, 4);
			} else {
				buffer += ".";
			}
		}
	}

	socket.write(buffer);
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
			pixel = board[x][ y];
			
			if(!pixel) continue;
			
			var r = parseInt(pixel.color.substr(0, 2), 16);
			var g = parseInt(pixel.color.substr(2, 2), 16);
			var b = parseInt(pixel.color.substr(4, 2), 16);
			
			var dominant = getDominant(r, g, b);
			
			for(var k = 0; k < 8; ++k) {
				var row = x + circle[k][0];
				var col = y + circle[k][1];
				var odds = 0;
				
				if(row < 0 || col < 0 || col >= COLS || row >= ROWS)
                    continue;
				
				var opp = board[col][row];
				
				if(!opp || opp.owner === pixel.owner) 
                    continue;
				
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
					
					if(!owners[pixel.owner]) 
                        owners[pixel.owner] = {win: 0, lose: 0};
					if(!owners[opp.owner]) 
                        owners[opp.owner] = {win: 0, lose: 0};
					
					owners[pixel.owner].win++;
					owners[opp.owner].lose++;
				}
			}
		}
	}
	
	//copy ownership at the end
	for(var pix in modified) {
		var dim = pix.split(",");
		if(dim.length !== 2) continue;

		board[+dim[0]][+dim[1]].owner = modified[pix];
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

	console.log("LOGS", journal.length, timestamp);

	for(var i = 0; i < journal.length; ++i) {
		if(journal[i].timestamp > timestamp) {
			socket.write(journal[i].qry + "\n");
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
		saveState();
		journal = [];
	}
	
	journal.push({timestamp: +timestamp, qry: qry});
	journal.sort(function(a,b) { return a.timestamp - b.timestamp; });
}

function getPixel(pixels, socket) {
	var pixel;
    console.log("GET", pixels);	
	for(var i = 0; i < pixels.length; ++i) {
		var dim = pixels[i].split(",");
		pixel = board[+dim[0]][+dim[1]];
		
		if(pixel && pixel.owner !== null) {
			socket.write(pixel.color + zeroPad(pixel.price, 3) + zeroPad(pixel.owner, 4));
		} else {
			socket.write(".");
		}
	}
}

function writePixel(pixels, cmd, socket) {
	console.log("WRITE", pixels, cmd);
	for(var i = 0; i < pixels.length; ++i) {
		var dim = pixels[i].split(",");
		var pixel = board[+dim[0]][+dim[1]];
		if(cmd[1] !== ".") pixel.color = cmd[1];
		if(cmd[2] !== ".") pixel.price = cmd[2];
		if(cmd[3] !== ".") pixel.owner = cmd[3];
	}

	saveState();
}

function getMetaData(pixel, name) {
	var dim = pixel.split(",");
	var pix = board[+dim[0]][+dim[1]];
	if(!pix) return;
	return pix[name];
}

function setMetaData(pixels, cmd) {
	var pixel;
    console.log("META", pixels, cmd);
	
	for(var i = 0; i < pixels.length; ++i) {
		var dim = pixels[i].split(",");
		var pixel = board[+dim[0]][+dim[1]];
		
		if(!pixel) continue;
		
		pixel[cmd[1]] = cmd[2];
	}
}

function deletePixel(pixels) {
	for(var i = 0; i < pixels.length; ++i) {
		var dim = pixels[i].split(",");
		var pix = board[+dim[0]][+dim[1]];
		pix.owner = null;
		pix.price = null;
		pix.color = null;
	}
}

//Save the board to a static JS file
function saveState() {
	console.log("SAVE STATE");
	var start = Date.now();
	var buffer = fs.createWriteStream("board.js");
	
	buffer.on("error", function(err) {
		console.log(err);
	});

	buffer.write("var DATA = '" + (Date.now() / 1000 | 0));
	getBoard(buffer);
	buffer.end("';\n");
	console.log("Save took ", Date.now() - start, "milliseconds");
}
