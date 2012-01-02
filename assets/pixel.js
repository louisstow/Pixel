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
	shadowColor = "#222222",
	selectColor = "00C8FF",
	
	hasFocus = true,
	
	sellList,
	buyList,
	total,
	nextCycle = unixtime(new Date());

var $hours,
	$minutes,
	$seconds;
	
var RecaptchaOptions = {
    theme : 'white'
};
	
$(function() {
	zoomer = document.createElement("div");
	$("#stage").append(zoomer);
	zoomer.setAttribute("class", "zoomer");
	stagePos = $("#stage").offset();
	stagePos.left++;
	stagePos.top++;
	
	//update the stage position
	$(window).resize(function() {
		stagePos = $("#stage").offset();
		stagePos.left++;
		stagePos.top++;
	});
	
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
	
	$(".color").each(function() {
		var self = $(this);
		
		self.ColorPicker({
			onChange: function(hsb, hex, rgb) {
				self.val(hex);
			}
		});
	});
	
	//check if the user is logged in
	api("IsLogged", function(resp) {
		console.log(resp);
		if(resp.error) {
			$("#login,#register").show();
			$("a.instructions").trigger("click");
		} else {
			updateUser(resp);
		}
	}, false);
	
	//retrieve the current board
	api("GetBoard", updateBoard);
	
	$("#login").click(function() {
		$("div.login").show();
		$("div.register").hide();
	});
	
	$("#register").click(function() {
		$("div.login").hide();
		$("div.register").show();
	});

    $("#logout").click(function() {
        if(me) {
            api("Logout", function() {
                $("#login, #register").show();
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
		
		api("Details", data, function() {
			showError("Details updated");
			$("div.change").hide();
			status();
		});
	});
	
	//user logged in
	$(".login button").click(function() {
		var email = $("div.login .email").val(),
			pass = $("div.login .pass").val();
			
		api("Login", {email: email, password: pass}, function(resp) {
			updateUser(resp);
		});
	});
	
	//user registered
	$(".register button").click(function() {
		var data = {}
		data.password = $("div.register .pass").val();
		data.email = $("div.register .email").val();
		data.url = $("div.register .url").val();
		data.message = $("div.register .message").val();
		data.color = $("div.register .color").val();
		data.respfield = $("#recaptcha_response_field").val();
		data.chafield = $("#recaptcha_challenge_field").val();
		
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
			if(count >= 9) break;
		}
		
		data.pixel = list;
		
		api("Register", data, function(resp) {
			updateUser(resp);
		});
	});
	
	$("a.default").click(function() {
		clearSelection();
		selected = "default";
		$(this).addClass("active");
		
		$("#stage").mousemove(function(e) {
			var pos = translate(e.clientX, e.clientY);
			var pixel = board[~~pos.x + ',' + ~~pos.y];
			
			if(!pixel) {
				$("#tooltip").hide().text("");
				return;
			}
			
			var info = owners[pixel.owner];
			var globalPos = translateGlobal(e.clientX, e.clientY);
			$("#tooltip").text(info.message).show().css({
				left: globalPos.left + 15,
				top: globalPos.top
			});
			
		}).click(function(e) {
			var pos = translate(e.clientX, e.clientY);
			var pixel = board[~~pos.x + ',' + ~~pos.y];
			
			if(!pixel) {
				showError("This pixel is available");
			} else {
				var info = owners[pixel.owner];
				var url = info.url;
				
				if(url.substr(0, 7) !== "http://" && url.substr(0, 8) !== "https://") {
					url = "http://" + url;
				}
				
				window.open(url);
			}
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
			showError("Please login");
			return;
		}
		
		if(mypixelsSelected) {
			$(this).removeClass("active");
			$("#stage").css("background", "transparent");
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
						if(!pixels[x + "," + y]) {
							pixels[x + "," + y] = true;
							pixels.length++;
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
			showError("Please login");
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
			showError("Please login");
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
			if(pix === "length") continue;
			
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
				//add one dollar to the price
				cost = 0.1;
			}
			
			total += cost;
			buyList.push(pix);
			
			if(pixels.length < 10000) html += "<li><b>" + pix + "</b><i>$" + cost.toFixed(2) + "</i><a class='remove'>remove</a></li>";
		}
		
		if(total == 0) {
			showError("Select some pixels to buy");
			$(this).removeClass("active");
			return;
		}
		
		$("div.buy div.list ul").html(html);
		
		if(pixels.length < 10000) {
			$("div.list a.remove").click(function() {
				var id = $(this).parent().find("b").text();
				var pixel = board[id];
				console.log(id);
				
				//loop over list
				for(var i = 0; i < buyList.length; ++i) {
					if(buyList[i] === id) {
						buyList.splice(i, 1);
					}
				}
				
				if(pixel) {
					total -= pixel.cost;
				} else {
					total -= 0.1;
				}
				
				$("div.buy span.total").text(total.toFixed(2));
				$("div.buy input.amount").val(total.toFixed(2));
				$("input.item").val(buyList.join(' '));
				$(this).parent().remove();
				
				delete pixels[id];
				redraw();
			});
		}
		
		$("div.buy span.total").text(total.toFixed(2));
		$("div.buy input.amount").val(total.toFixed(2));
		$("input.item").val(buyList.join(' '));
		$("input.payer").val(me.userID);
		$("input.payeremail").val(me.userEmail);
		$("div.buy").show();
		redraw();
	});
	
	$("a.sellpixel").click(function() {
		if(!me) {
			showError("Please login");
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
		
		if(value < 0.1 || value > 100.0 || isNaN(value)) {
			showError("Value must be between $0.10 and $100.00");
			value = 0.1;
		}
		
		$("input.slider").val(value.toFixed(2));
		$(this).val(value.toFixed(2));
	});
	
	$("button.sellb").click(function() {
		var value = $("input.display").val();
		var data = {pixels: sellList, cost: value};
		
		api("Sell", data, function() {
			showError("Your pixels are now on the market");
			$("div.sell").hide();
			$("a.sellpixel").removeClass("active");
		});
	});
	
	$("button.dsellb").click(function() {
		var data = {pixels: sellList, cost: 0};
		
		api("Sell", data, function() {
			showError("Your pixels are now off the market");
			$("div.sell").hide();
			$("a.sellpixel").removeClass("active");
		});
	});
	
	tick();
	setInterval(tick, 1000);
	setInterval(status, 1000 * 60);
});

function status() {
	api("GetBoard", updateBoard);
}

function updateBoard(data) {
	board = data.pixels;
	owners = data.owners;
	nextCycle = ~~(Date.parse(data.cycle.cycleTime) / 1000);
		
	if(data.events) {
		updateEvents(data.events);
	}
	
	redraw();
}

function tick() {
	//convert current time to UTC+0
	var date = unixtime(new Date());

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
	$("#login,#register").hide();
	$("#welcome").html("Here be <b>" + user.userEmail + "</b>").show();
	$("#money").text("$" + (+user.money).toFixed(2)).show();
	$("#events,#logout,#change").show();
	status();
}

function updateEvents(data) {
	console.log(data);
    //loop over all events and create html
    var i = 0, len = data.length;
    var html = "";
    for(; i < len; ++i) {
        html += "<li>"+data[i]+"</li>";
    }

    $("div.events ul").html(html);
}

function unixtime(time) {
	var newtime = +time;
	newtime = ~~((newtime + time.getTimezoneOffset() * 60000) / 1000);
	return newtime;
}

function clearSelection() {
	$("#tools a").removeClass("active");
	selected = null;
	stopZoomer();
	$("#stage").unbind("mousedown");
}

function selectPixel(x, y) {
	if(x < 0 || y < 0) {
		showError("Pixel out of bounds");
		return;
	}
		
	var key = x + "," + y;
	console.log(key);
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
		console.log(e, stagePos);
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
	data.pixels = [];
	
	//loop selected pixels
	for(var pix in pixels) {
		var pixel = board[pix];
		if(!pixel || pixel.owner != me.userID) continue;
		
		pixel.color = swatch;
		data.pixels.push(pix);
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
	console.log(startX, startY, endX, endY);
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
				console.log(owner, pixel.owner);
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
	return {
		x: (x - stagePos.left + body.scrollLeft) / zoomLevel + zoomPos.left,
		y: (y - stagePos.top + body.scrollTop) / zoomLevel + zoomPos.top
	}
}

function translateGlobal(x, y) {
	return {
		left: (x - stagePos.left + body.scrollLeft),
		top: (y - stagePos.top + body.scrollTop)
	}
}

function showError(msg) {
	console.error(msg);
	var $d = $("#dialog");
	$d.show().html(msg).animate({top: -4}, 150).delay(msg.length * 100)
		.animate({top: -50}, 150, function() {
			$(this).hide().html("");
		});
}

function api(action, data, callback, showErrorFlag) {
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
	
	$.ajax("api.php?action=" + action, {
		dataType: "json",
		data: data,
		success: function(data) {
			//if there is an error, automatically display
			if(showErrorFlag && data.error) {
				showError(data.error);
				return;
			}
			
			if(callback) callback(data);
		}
	});
};
