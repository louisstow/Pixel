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
	$cycleNum,
	$counter;
	
var RecaptchaOptions = {
    theme : 'white'
};

$(function() {
	var script = document.createElement("script");
	script.src = "board.js?_=" + Date.now();
	document.body.appendChild(script);

	//zoomer actually used for select box
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
			
			//T
			case 84: $("a.invert").click(); break;
		}
	});
	
	//stop key shortcuts in a textbox
	$("input").live("focus", function() {
		hasFocus = false;
	}).live("blur", function() {
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
	$counter = $("#counter");

	//board might not be loaded, keep checking	
	var checkCounter = 0;
	(function checkData() {
		console.log("ATTEMPT AGAIN");
		checkCounter++;
		if(checkCounter > 10) {
			console.log("COULD NOT FIND DATA");
		} else if(window.DATA) { 
			updateBoard(DATA);
			status();
		} else setTimeout(checkData, 10);
	})()
	
	
	//check if the user is logged in
	api("IsLogged", function(resp) {
		if(resp.error) {
			$("#login,#register,#lostp").show();
			$("a.instructions").trigger("click");
		} else {
			updateUser(resp);
		}
	}, false);
	
	initControls();

	tick();
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
