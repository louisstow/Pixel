var canvas, 
	ctx, 
	board = {}, 
	owners = {}, 
	canvasWidth, 
	canvasHeight,
	body,
	me,
	pixels = {length: 0}, //selected pixes
	stagePos,
	zoomPos = {left: 0, top: 0},
	zoomLevel = 1,
	zoomer,
	selected, //which tool is selected
	tab, //which tab is selected
	swatch = "000000",
	mypixelsSelected = false,
	moveSelected = false,
	shadowColor = "#222222",
	selectColor = "00C8FF",
	
	hasFocus = true,
	
	sellList,
	buyList,
	total,
	nextCycle = ~~(new Date / 1000),
	currentTimestamp,
	currentCycle = -1;

var $hours,
	$minutes,
	$seconds,
	$cycleNum;
	
var RecaptchaOptions = {
    theme : 'white'
};
	
$(function() {
	zoomer = document.createElement("div");
	$("#stage").append(zoomer);
	zoomer.setAttribute("class", "zoomer");
	stagePos = $("#canvas").offset();
	
	//update the stage position
	$(window).resize(function() {
		stagePos = $("#canvas").offset();
	});
	
	$(window).bind("selectstart", function() { return false; });
	
	//shortcut keys
	$(document).keydown(function(e) {
		if(!hasFocus) return;
		
		switch(e.which) {
			//B
			case 66: $("a.buypixel").click(); break;
			
			//E
			case 69: $("a.sellpixel").click(); break;
			
			//M
			case 77: $("a.mypixels").click(); break;
			
			//I
			case 73: $("a.instructions").click(); break;
			
			//D
			case 68: $("a.default").click(); break;
			
			//S
			case 83: $("a.select").click(); break;
			
			//X
			case 88: $("a.selectmypixels").click(); break;
			
			//C
			case 67: $("a.clearselection").click(); break;
			
			//Z
			case 90: $("a.zoomin").click(); break;
			
			//R
			case 82: $("a.swatch").click(); break;
			
			//V
			case 86: $("a.move").click(); break;
			
			//1
			case 49: $("a.x16").click(); break;
			
			//2
			case 50: $("a.x2").click(); break;
			
			//4
			case 52: $("a.x4").click(); break;
			
			//8
			case 56: $("a.x8").click(); break;
		}
	});
	
	//stop key shortcuts in a textbox
	$("input").focus(function() {
		hasFocus = false;
	}).blur(function() {
		hasFocus = true;
	});
	
	//init canvases
	canvas = $("#canvas")[0];
	ctx = canvas.getContext("2d");
	
	canvasWidth = canvas.width;
	canvasHeight = canvas.height;
	body = document.body;
	
	$hours = $("span.hours");
	$minutes = $("span.minutes");
	$seconds = $("span.seconds");
	$cycleNum = $("span.num");
	
	if(window.DATA) updateBoard(DATA);
	
	$(".color").each(function() {
		var self = $(this);
		
		self.focus(function() {
			$(this).click();
		});
		
		self.ColorPicker({
			onChange: function(hsb, hex, rgb) {
				self.val(hex);
			}
		});
	});
	
	//check if the user is logged in
	api("IsLogged", function(resp) {
		if(resp.error) {
			$("#login,#register,#lostp").show();
			$("a.instructions").trigger("click");
		} else {
			updateUser(resp);
		}
	}, false);
	
	$("#login").click(function() {
		if($("div.login").is(":visible")) {
			$("div.login").hide();
		} else {
			$("div.login").show();
		}
		$("div.register, div.lostpass").hide();
	});
	
	$("#register").click(function() {
		
		if($("div.register").is(":visible")) {
			$("div.register").hide();
		} else {
			//player must choose a pixel
			if(pixels.length < 10) {
				showError("Select 10 free pixels with the select tool.");
				return;
			}
			
			$("div.register").show();
		}
				
		$("div.login, div.lostpass").hide();
	});
	
	$("#lostp").click(function() {
		if($("div.lostpass").is(":visible")) {
			$("div.lostpass").hide();
		} else {
			$("div.lostpass").show();
		}
		
		$("div.login, div.register").hide();
	});

	$("div.lostpass button").click(function() {
		if(disableButton(this)) return;
		
		var param = {
			email: $("div.lostpass input.email").val()
		};
		
		var self = this;
		
		api("LostPass", param, function(resp) {
			disableButton(self, true);
			if(resp.error) {
				return showError(resp.error);
			}
		
			$("div.lostpass input.email").val("");
			$("#lostp").trigger("click");
			showError("An email has been sent with details to change your password.");
		}, false);
	});

    $("#logout").click(function() {
        if(me) {
            api("Logout", function() {
				if(mypixelsSelected) {
					$(this).removeClass("active");
					$("#stage").css("background", "#fff");
					mypixelsSelected = false;
				}
				
                $("#login, #register, #lostp").show();
                $("#welcome, #money").text("").hide();
                $("#logout, #events, div.events, #change, div.change").hide();
				me = null;
            });
        }
    });

    $("#events").click(function() {
		$("div.change").hide();
        $("div.events").toggle();
    });
	
	$("#change").click(function() {
		$("div.events").hide();
		$("div.change").toggle();
	});
	
	$("div.change button").click(function() {
		var data = {};
		data.message = $("div.change input.message").val();
		data.url = $("div.change input.url").val();
		data.oldp = $("div.change input.old").val();
		data.newp = $("div.change input.newp").val();
		
		api("Details", data, function() {
			showError("Details updated");
			$("div.change").hide();
			status();
		});
	});
	
	//user logged in
	$(".login button").click(function() {
		if(disableButton(this)) return;
	
		var email = $("div.login .email").val(),
			pass = $("div.login .pass").val(),
			self = this;
			
		api("Login", {email: email, password: pass}, function(resp) {
			disableButton(self, true);
			
			if(resp.error) {
				return showError(resp.error);
			}
			
			updateUser(resp);
		}, false);
	});
	
	//user registered
	$(".register button").click(function() {
		if(disableButton(this)) return;
		
		var data = {}
		data.password = $("div.register .pass").val();
		data.email = $("div.register .email").val();
		data.url = $("div.register .url").val();
		data.message = $("div.register .message").val();
		data.color = $("div.register .color").val();
		data.respfield = $("#recaptcha_response_field").val();
		data.chafield = $("#recaptcha_challenge_field").val();
		
		var self = this;
		
		//player must choose a pixel
		if(pixels.length < 10) {
			showError("Select 10 free pixels with the select tool.");
			return;
		}
		
		var count = 0;
		var list = [];
		//loop over selected pixels
		for(var pix in pixels) { 
			//don't confuse pixels with proto or length
			if(pix === "length" || !pixels.hasOwnProperty(pix)) continue;
			
			if(board[pix]) continue;
			
			list.push(pix);
			
			//as long as none of the above
			count++;
			if(count > 9) break;
		}
		
		data.pixel = list;
		
		api("Register", data, function(resp) {
			disableButton(self, true);
			
			if(resp.error) {
				Recaptcha.reload()
				return showError(resp.error);
			}
			
			updateUser(resp);
		}, false);
	});
	
	$("a.default").click(function() {
		clearSelection();
		selected = "default";
		$(this).addClass("active");
		
		$("#stage").mousemove(function(e) {
			var pos = translate(e.clientX, e.clientY);
			var pixel = board[Math.floor(pos.x) + ',' + Math.floor(pos.y)];
			
			if(!pixel) {
				$("#tooltip").hide();
				$("#tooltip span").text("");
				return;
			}
			
			var info = owners[+pixel.owner];
			if(!info) return;
			
			var globalPos = translateGlobal(e.clientX, e.clientY);
			$("#tooltip .message").text(info.message);
			$("#tooltip .url").text(info.url);
			$("#tooltip .price").text("$" + (pixel.cost / 100).toFixed(2));
			
			$("#tooltip").show().css({
				left: globalPos.left + 15,
				top: globalPos.top
			});
			
		}).click(function(e) {
			var pos = translate(e.clientX, e.clientY);
			var pixel = board[~~pos.x + ',' + ~~pos.y];
			
			if(!pixel) {
				showError("This pixel is available");
			} else {
				var info = owners[+pixel.owner];
				var url = info.url;
				
				if(url.substr(0, 7) !== "http://" && url.substr(0, 8) !== "https://") {
					url = "http://" + url;
				}
				
				window.open(url);
				$("#tooltip").hide();
			}
		}).mouseleave(function() {
			$("#tooltip").hide();
		});
	}).trigger("click");
	
	$("a.instructions").click(function() {
		if($("div.instr").is(":visible")) {
			$("div.instr").hide();
			$(this).removeClass("active");
			return;
		}
		
		$(this).addClass("active");
		$("div.instr").show();
	});
	
	$("a.zoomin").click(function() {
		clearSelection();
		drawBoard(mypixelsSelected && me.userID);
		$(this).text("Zoom In");
		$("a.default").trigger("click");
	});
	
	$(".x2, .x4, .x8, .x16").click(function() {
		clearSelection();
		$("a.zoomin").addClass("active");
		
		var level = parseInt($(this).attr("class").substr(1), 10);
		startZoomer(level);
	});
	
	$("a.mypixels").click(function() {
		if(!me) {
			showError("Please login or register");
			return;
		}
		
		if(mypixelsSelected) {
			$(this).removeClass("active");
			$("#stage").css("background", "#fff");
			mypixelsSelected = false;
		} else {
			$(this).addClass("active");
			$("#stage").css("background", shadowColor);
			mypixelsSelected = true;
		}
		
		redraw();
	});
	
	$("a.select").click(function() {
		clearSelection();
		selected = "select";
		$("#stage").unbind();
		$(this).addClass("active");
		
		$("#stage").mousedown(function(e) {
			//start pixel
			var pos = translate(e.clientX, e.clientY);
			pos.x = ~~pos.x;
			pos.y = ~~pos.y;
			
			var startZoomPos = translateGlobal(e.clientX, e.clientY);;
			
			var zoomOff = true;
			
			//end pixel
			$(this).mousemove(function(d) {
				
				if(zoomOff) {
					//user the zoomer div preview
					$(zoomer).show().css({
						left: startZoomPos.left,
						top: startZoomPos.top,
						width: 1,
						height: 1
					});
					
					zoomOff = false;
				}
			
				var currentPos = translateGlobal(d.clientX, d.clientY);
				
				$(zoomer).show().css({
					left: Math.min(currentPos.left, startZoomPos.left),
					top: Math.min(currentPos.top, startZoomPos.top),
					width: Math.abs(currentPos.left - startZoomPos.left),
					height: Math.abs(currentPos.top - startZoomPos.top)
				});
			}).mouseup(function(d) {
				var pos2 = translate(d.clientX, d.clientY);
				pos2.x = ~~pos2.x;
				pos2.y = ~~pos2.y;
				var diffx = pos2.x < pos.x ? -1 : 1;
				var diffy = pos2.y < pos.y ? -1 : 1;
				var x = pos.x, y;
				
				$(zoomer).hide();
				
				//if the mouseup is the same position as down, it was a click
				if(~~pos.x === ~~pos2.x && ~~pos.y === ~~pos2.y) {
					$(this).unbind("mousemove").unbind("mouseup");
					selectPixel(~~pos.x, ~~pos.y);
					return;
				}
				//loop over the x difference
				while(x !== pos2.x + diffx) {
					y = pos.y;
					
					//loop over the y difference
					while(y !== pos2.y + diffy) {
					
						if(!pixels[x + "," + y] && x >= 0 && y >= 0) {
							pixels[x + "," + y] = true;
							pixels.length++;
						} else {
							delete pixels[x + "," + y];
							pixels.length--;
						}
						y += diffy;
					}
					
					x += diffx;
				}
				
				redraw();
			
				$(this).unbind("mousemove").unbind("mouseup");
			});
		});
	});
	
	$("a.clearselection").click(function() {
		pixels = {length: 0 };
		redraw();
	});
	
	$("a.selectmypixels").click(function() {
		if(!me) {
			showError("Please login or register");
			return;
		}
		
		pixels = {length: 0};
		for(var pos in board) {
			var pix = board[pos];
			if(pix.owner != me.userID) continue;
		
			pixels[pos] = true;
			pixels.length++;
		}
		
		redraw();
	});
	
	$("a.move").click(function() {
		if(!me) {
			showError("Please login or register");
			return;
		}
		
		clearSelection();
		selected = "move";
		$("#stage").unbind();
		$(this).addClass("active");
		pixels = {length: 0};
		
		$("#stage").click(function(e) {
			var pos = translate(e.clientX, e.clientY);
			var key = ~~pos.x + "," + ~~pos.y;
			var pixel = board[key];
			
			//check if free pixel
			if(moveSelected) {
				//deselect if same key
				if(key === moveSelected) {
					moveSelected = false;
					pixels = {length: 0};
					redraw();
					return;
				}
			
				//if someone owns it
				if(pixel) {
					showError("That pixel is taken. You may purchase this pixel for $" + (pixel.cost / 100).toFixed(2));
					return;
				}
				
				api("MovePixel", {from: moveSelected, to: key}, function() {
					status();
				});
				
				pixels = {length: 0};
				
				moveSelected = false;
			} else {
				if(!pixel || (pixel && pixel.owner != me.userID)) {
					showError("You can only move your own pixels.");
					return;
				}
				
				moveSelected = key;
				pixels[key] = true;
			}
			
			redraw();
		});
	});
	
	$("a.swatch").ColorPicker({
		onChange: function(a, hex, c) {
			$("a.swatch span").css("background", "#" + hex);
			swatch = hex;
		},
		
		onHide: function() {
			updateColors();
		},
		
		onBeforeShow: function() {
			$(this).ColorPickerSetColor(swatch);
		}
	});
	
	$("a.buypixel").click(function() {
		if(!me) {
			showError("Please login or register");
			return;
		}
		
		//hide if opened
		if($("div.buy").is(":visible")) {
			$("div.buy").hide();
			$(this).removeClass("active");
			return;
		}
		
		if(pixels.length === 0) {
			showError("Select some pixels to buy");
			return;
		}
		
		$(this).addClass("active");
		
		
		total = 0;
		var html = "";
		buyList = [];
		for(var pix in pixels) {
			if(pix === "length" || !pixels.hasOwnProperty(pix)) continue;
			
			var pixel = board[pix];
			var cost;
			if(pixel) {
				//if pixel for sale, add to total, else deselect
				if(pixel.cost && pixel.owner != me.userID) cost = +pixel.cost;
				else {
					delete pixels[pix];
					continue;
				}
			} else {
				//add 10 cents to the price
				cost = 10;
			}
			
			total += cost;
			buyList.push(pix);
			
			if(pixels.length < 10000) html += "<li><b>" + pix + "</b><i>$" + (cost / 100).toFixed(2) + "</i><a class='remove'>remove</a></li>";
		}
		
		//2 dollar minimum
		if(total < 200) {
			showError("You must buy at least $2.00 worth of pixels.");
			$(this).removeClass("active");
			return;
		}
		
		//cant buy more than 100k pixels
		if(buyList.length > 100000) {
			showError("Maximum amount of pixels is 100,000");
			$(this).removeClass("active");
			return;
		}
		
		$("div.buy div.list ul").html(html);
		$("div.buy").show();
		$("#paypal").hide();
		$("#paypal_loading").text("Loading").show();
		
		if(pixels.length < 10000) {
			$("div.list a.remove").click(function() {
				$("#paypal").hide();
				var id = $(this).parent().find("b").text();
				var pixel = board[id];
				
				//loop over list
				for(var i = 0; i < buyList.length; ++i) {
					if(buyList[i] === id) {
						buyList.splice(i, 1);
					}
				}
				
				if(pixel) {
					total -= pixel.cost;
				} else {
					total -= 10;
				}
				
				api("SaveOrder", {pixels: buyList.join(' '), POST: true}, function(resp) {
					$("div.buy span.total").text((total / 100).toFixed(2));
					$("div.buy input.amount").val((total / 100).toFixed(2));
					$("input.item").val(resp.orderID);
					$("input.payer").val(me.userID);
					$("input.payeremail").val(me.userEmail);
					$("#paypal").show();
				});
				
				$(this).parent().remove();
				
				delete pixels[id];
				redraw();
			});
		}
		
		api("SaveOrder", {pixels: buyList.join(' '), POST: true}, function(resp) {
			$("input.item").val(resp.orderID);
			$("#paypal").show();
			$("#paypal_loading").hide();
		});
		
		$("input.payer").val(me.userID);
		$("div.buy span.total").text((total / 100).toFixed(2));
		$("div.buy input.amount").val((total / 100).toFixed(2));
		$("input.payeremail").val(me.userEmail);
		redraw();
	});
	
	$("a.sellpixel").click(function() {
		if(!me) {
			showError("Please login or register");
			return;
		}
		
		//hide if opened
		if($("div.sell").is(":visible")) {
			$("div.sell").hide();
			$(this).removeClass("active");
			return;
		}
		
		if(pixels.length === 0) {
			showError("Select some pixels to sell");
			return;
		}
		
		sellList = []
		for(var pix in pixels) {
			var pixel = board[pix];
			
			if(!pixel || pixel.owner != me.userID) {
				delete pixels[pix];
				continue;
			}
			
			sellList.push(pix);
		}
		
		if(sellList.length === 0) {
			showError("Select your own pixels to sell");
			return;
		}
		
		$(this).addClass("active");
		$("div.sell").show();
		redraw();
	});
	
	$("input.slider").change(function() {
		var value = (+$(this).val()).toFixed(2);
		$("input.display").val(value);
	});
	
	$("input.display").change(function() {
		var value = +$(this).val();
		
		if(value < 0.1 || value > 50.0 || isNaN(value)) {
			showError("Value must be between $0.10 and $50.00");
			value = 0.1;
		}
		
		$("input.slider").val(value.toFixed(2));
		$(this).val(value.toFixed(2));
	});
	
	$("button.sellb").click(function() {
		if(disableButton(this)) return;
		
		var value = $("input.display").val();
		var data = {pixels: sellList.join(" "), cost: value, POST: true};
		var self = this;
		
		api("Sell", data, function(resp) {
			disableButton(self, true);
			
			if(resp.error) {
				return showError(resp.error);
			}
		
			showError("Your pixels are now on the market");
			$("div.sell").hide();
			$("a.sellpixel").removeClass("active");
			status();
		}, false);
	});
	
	tick();
	status();
	setInterval(tick, 1000);
	setInterval(status, 1000 * 10);
});

//should grab logs
function status() {
	if(!currentTimestamp) return;
	
	api("Status", {time: currentTimestamp}, function(resp) {
		nextCycle = +resp.cycle.cycleTime;
		currentTimestamp = resp.time;
		
		if(resp.events) {
			updateEvents(resp.events);
		}
		
		$cycleNum.text(resp.cycle.cycleID);
		
		//if current cycle has been set and we have a new one, reload
		if(currentCycle !== -1 && currentCycle !== +resp.cycle.cycleID) {
			window.location.reload();
			return;
		}
		
		//set the current cycle
		currentCycle = +resp.cycle.cycleID;
		
		applyLogs(resp.log);
	});
}

function updateBoard(data) {
	currentTimestamp = data.substr(0, 10);
	parse = data.substr(10);
	var len = parse.length;
	var x = 0, y = 0;
	var params = {};
	var ownr = {};
	
	for(var i = 0; i < len; i++) {
		if(parse.charAt(i) === '') break;
		
		if(parse.charAt(i) === '.') {
			x++;
			
			if(x == 1200) {
				x = 0;
				y++;
			}
			continue;
		}
		
		if(x == 1200) {
			x = 0;
			y++;
		}
		
		var key = x + "," + y;
		
		if(!board[key]) {
			board[key] = {};
		}
		
		board[key].color = parse.substr(i, 6);
		board[key].cost = parseInt(parse.substr(i + 6, 3), 16) * 10;
		board[key].owner = parseInt(parse.substr(i + 9, 4), 16);
		
		if(!owners[board[key].owner]) ownr[board[key].owner] = true;
		
		x++;
		i += 12;
	}
	
	//convert owners object to param array
	params.owners = [];
	for(var id in ownr) {
		if(!ownr.hasOwnProperty(id) || !ownr[id]) continue;
		params.owners.push(+id);
	}
	
	//grab the information about owners
	if(params.owners && params.owners.length)
		api("GetUsers", params, getUsers);
	
	redraw();
}

function getUsers(resp) {
	var i = 0, l = resp.length, user;
	for(;i < l; ++i) {
		user = resp[i];
		if(user.url.substr(0, 7) !== "http://" && user.url.substr(0, 8) !== "https://") {
			user.url = "http://" + user.url;
		}
		owners[+user.userID] = {message: user.message, url: user.url};
	}
}

function applyLogs(logs) {
	if(!logs) return;
	
	//log too big, refresh page
	if(log == ".") {
		window.location.reload();
		return;
	}
	
	var logs = logs.split('\n'),
		i = 0, len = logs.length,
		log, o,
		ownr = {},
		param = {};
	
	//split the logs on newline
	for(;i < len; ++i) {
		log = logs[i];
		if(!log) continue;
		
		var opts = log.split(' ');
		var pixels = opts[0].split('|');
		
		//loop over pixels
		for(var p = 0; p < pixels.length; ++p) {
			var pixel = pixels[p];
			
			//delete pixel
			if(opts[1] == 'd') {
				delete board[pixel];
				continue;
			}
			
			//init if not exists
			if(!board[pixel]) {
				board[pixel] = {};
			}
			
			//update the board
			if(opts[2] != '.') board[pixel].color = opts[2];
			if(opts[3] != '.') board[pixel].cost = parseInt(opts[3], 16) * 10;
			if(opts[4] != '.') board[pixel].owner = parseInt(opts[4], 16);
			o = board[pixel].owner;
			
			//if we dont know about this owner, get it
			if(o && (!owners[o] && !ownr[o])) {
				ownr[o] = true;
			}
		}
	}
	
	param.owners = [];
	for(var ow in ownr) {
		if(!ownr.hasOwnProperty(ow) || !ownr[ow]) continue;
		param.owners.push(ow);
	}
	
	redraw();
	if(param.owners && param.owners.length)
		api("GetUsers", param, getUsers);
}

function tick() {
	//convert current time to UTC+0
	var date = ~~(+ new Date / 1000);

	var diff = nextCycle - date;
	
	var hours = ~~(diff / 60 / 60);
	var minutes = ~~(diff / 60) % 60;
	var seconds = diff % 60;
	
	if(hours < 0) hours = 0;
	if(minutes < 0) minutes = 0;
	if(seconds < 0) seconds = 0;
	
	$hours.text(hours + " hour" + (hours === 1 ? "" : "s"));
	$minutes.text(minutes + " minute" + (minutes === 1 ? "" : "s"));
	$seconds.text(seconds + " second" + (seconds === 1 ? "" : "s"));
}

function updateUser(user) {
	me = user;
	$("div.register").hide();
	$("div.login").hide();
	$("div.login input").val("");
	$("div.register input").val("");
	$("#login,#register,#lostp").hide();
	$("#welcome").text(user.userEmail).show();
	$("#money").text("$" + (+user.money).toFixed(2)).show();
	$("#events,#logout,#change").show();
	$("a.instructions").removeClass("active");
	$("div.instr").hide();
	$("div.change input.url").val(user.url);
	$("div.change input.message").val(user.message);
	status();
}

function updateEvents(data) {
    //loop over all events and create html
    var i = 0, len = data.length;
    var html = "";
    for(; i < len; ++i) {
		if(data[i].cycleID == 0) {
			html += "<li>"+data[i].event+"</li>";
		} else {
			html += "<li><b>Cycle "+data[i].cycleID+"</b> "+data[i].event+"</li>";
		}
    }

	if(i === 0) {
		$("div.events ul").html("<li>No events to show</li>")
	} else {
		$("div.events ul").html(html);
	}
}

function unixtime(time) {
	var newtime = +time;
	newtime = ~~((newtime + time.getTimezoneOffset() * 60000) / 1000);
	return newtime;
}

function disableButton(obj, restore) {
	var $obj = $(obj);
	
	if(restore) {
		$obj.removeClass("disabled");
		return true;
	}
	
	if($obj.hasClass("disabled")) {
		return true;
	}
	
	$obj.addClass("disabled");
	return false;
}

function clearSelection() {
	$("#tools a").removeClass("active");
	selected = null;
	stopZoomer();
	$("#stage").unbind("mousedown").unbind("click").unbind("mouseleave");
	moveSelected = false;
}

function selectPixel(x, y) {
	if(x < 0 || y < 0) {
		showError("Pixel out of bounds");
		return;
	}
		
	var key = x + "," + y;
	if(pixels[key]) {
		delete pixels[key];
		pixels.length--;
	} else {
		pixels[key] = true;
		pixels.length++;
	}
	
	redraw();
}

function startZoomer(level) {
	stagePos = $("#canvas").offset();
	//reset to 1
	if(zoomLevel !== 1) drawBoard();
	
	selected = "zoom";
	var w = canvasWidth / level,
		h = canvasHeight / level;
		
	$(zoomer).css({
		width: w,
		height: h
	}).show();
	
	$("#stage").mousemove(function(e) {
		$(zoomer).css({
			left: (e.clientX - stagePos.left + body.scrollLeft) - w / 2,
			top: (e.clientY - stagePos.top + body.scrollTop) - h / 2
		});
	}).click(function(e) {
		drawZoom(
			((e.clientX - stagePos.left + body.scrollLeft) - w / 2),
			((e.clientY - stagePos.top + body.scrollTop) - h / 2),
			level,
			mypixelsSelected && me.userID
		);
		
		$("a.zoomin").html("<u>Z</u>oom Out");
		stopZoomer();
		$("a.default").trigger("click");
	});
}

function stopZoomer() {
	$(zoomer).hide();
	$("#stage").unbind("mousemove").unbind("click");
}

function updateColors() {
	if(!me) {
		return;
	}
	
	var data = {};
	data.color = swatch;
	data.pixels = "";
	data.POST = true;
	
	//loop selected pixels
	for(var pix in pixels) {
		var pixel = board[pix];
		if(!pixel || pixel.owner != me.userID) continue;
		
		pixel.color = swatch;
		data.pixels += pix + " ";
	}
	
	if(data.pixels.length === 0) return;
	
	api("ChangeColor", data);
	redraw();
}

function drawBoard(owner) {
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	var imgdata = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	var color;
	var pixel;
	var index;
	var data = imgdata.data;
	
	//loop over board
	for(var pos in board) {
		pixel = board[pos];
		//skip if only drawing owner
		if(owner && pixel.owner != owner) continue;
		
		pos = pos.split(",");
		index = (pos[1] * canvasWidth + (+pos[0])) * 4;
		color = pixels[pos] ? selectColor : pixel.color;
		
		data[index] = parseInt(color.substr(0, 2), 16);   //red
		data[++index] = parseInt(color.substr(2, 2), 16); // green
		data[++index] = parseInt(color.substr(4, 2), 16); // blue
		data[++index] = 255;
	}
	
	//loop over selected pixels
	for(var pos in pixels) {
		pixel = board[pos];
		if(owner && !pixel) continue;
		if(owner && pixel.owner != owner) continue;
		
		pos = pos.split(",");
		index = (pos[1] * canvasWidth + (+pos[0])) * 4;
	
		data[index] = parseInt(selectColor.substr(0, 2), 16);   //red
		data[++index] = parseInt(selectColor.substr(2, 2), 16); // green
		data[++index] = parseInt(selectColor.substr(4, 2), 16); // blue
		data[++index] = 255;
	}
	
	zoomPos.left = 0;
	zoomPos.top = 0;
	zoomLevel = 1;
	ctx.putImageData(imgdata, 0, 0);
}

/**
* Draw the board at a certain zoom level
*/
function drawZoom(startX, startY, level, owner) {
	var endX = startX + canvasWidth / level;
	var endY = startY + canvasHeight / level;
	var x, y, pixel, index;
	
	zoomPos.left = startX;
	zoomPos.top = startY;
	
	//clear canvas
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	
	for(x = ~~startX; x < endX; ++x) {
		for(y = ~~startY; y < endY; ++y) {
			pixel = board[x + "," + y];
			
			//if no pixel found, don't draw
			if(!pixel && !pixels[x + "," + y]) continue;
			
			//only show existing pixels
			if(owner && !pixel) {
				continue;
			}
			
			//if only draw the specified owner
			if(owner && pixel.owner != owner) {
				continue;
			}
			
			ctx.fillStyle = "#" + (pixels[x + "," + y] ? selectColor : pixel.color);
			ctx.fillRect(
				(x - startX) * level, 
				(y - startY) * level, 
				level, 
				level
			);
		}
	}
	
	zoomLevel = level;
}

function redraw() {
	if(zoomLevel === 1) {
		drawBoard(mypixelsSelected && me.userID);
	} else {
		drawZoom(zoomPos.left, zoomPos.top, zoomLevel, mypixelsSelected && me.userID);
	}
}

function translate(x, y) {
	stagePos = $("#canvas").offset();
	return {
		x: (x - stagePos.left + body.scrollLeft) / zoomLevel + zoomPos.left,
		y: (y - stagePos.top + body.scrollTop) / zoomLevel + zoomPos.top
	}
}

function translateGlobal(x, y) {
	stagePos = $("#canvas").offset();
	return {
		left: (x - stagePos.left + body.scrollLeft),
		top: (y - stagePos.top + body.scrollTop)
	}
}

function showError(msg) {
	var $d = $("#dialog");
	$d.css("left", ($(window).width() - 1200) / 2).show().text(msg).animate({bottom: 0}, 150).delay(msg.length * 100)
		.animate({bottom: -50}, 150, function() {
			$(this).hide().html("");
		});
}

function api(action, data, callback, showErrorFlag) {
	var format = "GET";
	
	//allow empty data
	if(typeof data === "function") {
		showErrorFlag = callback;
		callback = data;
		data = null;
	}
	
	//default to show error
	if(showErrorFlag === undefined) {
		showErrorFlag = true;
	}
	
	if(data && data.POST) {
		format = "POST";
		delete data.POST;
	}
	
	$.ajax("api.php?action=" + action, {
		dataType: "json",
		type: format,
		data: data,
		success: function(data) {

			//if there is an error, automatically display
			if(showErrorFlag && data.error) {
				showError(data.error);
				return;
			}
			
			if(callback) callback(data);
		},
		error: function(a,e,c) {
			console.error(a,e,c);
		}
	});
};
