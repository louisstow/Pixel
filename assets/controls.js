function initControls () {


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
			//player can choose pixels
			if(pixels.length < 30) {
				showError("Remember, you can select 30 free pixels");
				$("a.select").trigger("click");
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
			
			owners[+me.userID].message = data.message;
			owners[+me.userID].url = data.url;
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
		data.respfield = $("#recaptcha_response_field").val();
		data.chafield = $("#recaptcha_challenge_field").val();
		
		var self = this;
		
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
			if(count > 29) break;
		}
		
		data.pixel = list.length ? list : "";
		
		api("Register", data, function(resp) {
			disableButton(self, true);
			
			if(resp.error) {
				Recaptcha.reload()
				return showError(resp.error);
			}
			
			updateUser(resp, function() {
				$(".register").trigger(":Registered", resp);	
			});
		}, false);
	});
	
	$("a.default").click(function() {
		clearSelection();

		selected = "default";
		$(this).addClass("active");
		
		var downPos, 
			dragging = false, 
			dragged = false, 
			lastPos;

		$("#canvas")
			.click(function(e) {
				if(!e.shiftKey) return;
				var up = translate(e.clientX, e.clientY);
				var pixel = board[~~up.x + ',' + ~~up.y];

				if(!pixel) {
						showError("This pixel is available");
				} else {
						var info = owners[+pixel.owner];
						if(!info) return;
						var url = info.url;
						
						if(/https?\:\/\//.test(url)) url = "http://" + url;
						
						window.open(url);
						$("#tooltip").hide();
				}
			})
			.dblclick(function(e) {
				//increase zoom by power of 2
				if(zoomLevel === 64) return;
				var pos = translate(e.clientX, e.clientY);

				var newZoom = zoomLevel * 2;
				var width = (1200 / newZoom) / 2;
				var height  = (1000 / newZoom) / 2;
				var midPointX = pos.x;
				var midPointY = pos.y;
				var x = midPointX - width;
				var y = midPointY - height;

				console.log(newZoom, width, height, midPointX, midPointY, x, y)
				if(x < 0) x = 0;
				if(y < 0) y = 0;
				if(x > 1200 - 1200 / newZoom) x = 1200 - 1200 / newZoom;
				if(y > 1000 - 1000 / newZoom) y = 1000 - 1000 / newZoom;


				console.log(lastRenderedZoom, width, height, midPointX, midPointY, x, y, 1200 - 1200 / newZoom)

				drawZoom(x, y, newZoom);
			})
			.mousedown(function(e) {
				if(zoomLevel > 1)
					dragging = true;
				downPos = translate(e.clientX, e.clientY);
				lastPos = {
					x: downPos.x,
					y: downPos.y
				}
			})
			.mouseup(function(e) {
				console.log("TWO")

				dragging = dragged = false;
				downPos = null;
			})
			.mousemove(function(e) {
				if(dragging) {
					var pos = translate(e.clientX, e.clientY);
					zoomPos.left += lastPos.x - pos.x;
					zoomPos.top += lastPos.y - pos.y;

					if(zoomPos.left < 0) zoomPos.left = 0;
					if(zoomPos.top < 0) zoomPos.top = 0;
					if(zoomPos.left > 1200 - 1200 / zoomLevel) zoomPos.left = 1200 - 1200 / zoomLevel;
					if(zoomPos.top > 1000 - 1000 / zoomLevel) zoomPos.top = 1000 - 1000 / zoomLevel;

					dragged = true;
					ctx.clearRect(0,0,canvasWidth,canvasHeight);
					
					if(zoomLevel < 8) {
						ctx.drawImage(
							offscreen,
							zoomPos.left * zoomLevel | 0,
							zoomPos.top * zoomLevel | 0,
							canvasWidth,
							canvasHeight,
							0,
							0,
							canvasWidth,
							canvasHeight
						);
					} else {
						drawRange(
							zoomPos.left,
							zoomPos.top,
							zoomLevel
						);
					}

					if(window.localStorage) {
						window.localStorage["viewport"] = zoomPos.left + "," + zoomPos.top + "," + zoomLevel;
					}
				} else {
					showTooltip(e);
				}
			})

			.mouseleave(function() {
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
	
	$("a.mypixels").click(function() {
		if(!me) {
			showError("Please login or register");
			return;
		}
		
		if(mypixelsSelected) {
			$(this).removeClass("active");
			mypixelsSelected = false;
		} else {
			$(this).addClass("active");
			mypixelsSelected = true;
		}
		
		redraw();
	});
	
	$("a.invert").click(function() {
		if($(this).hasClass("active")) {
			$(this).removeClass("active");
			$("#stage").css("background", "#fff");
		} else {
			$(this).addClass("active");
			$("#stage").css("background", shadowColor);
		}
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

			if(pos.x < 0 || pos.x >= 1200 || pos.y < 0 || pos.y >= 1000) {
				$(this).unbind("mousemove").unbind("mouseup");
				return;
			}

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

				$(zoomer).hide();

				if(pos2.x < 0 || pos2.x >= 1200 || pos2.y < 0 || pos2.y >= 1000) {
					$(this).unbind("mousemove").unbind("mouseup");
					return;
				}

				var diffx = pos2.x < pos.x ? -1 : 1;
				var diffy = pos2.y < pos.y ? -1 : 1;
				var x = pos.x, y;
				
				
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
		$("#canvas").unbind();
		$(this).addClass("active");
		pixels = {length: 0};
		
		$("#canvas").click(function(e) {
			var pos = translate(e.clientX, e.clientY);
			var key = ~~pos.x + "," + ~~pos.y;
			var pixel = board[key];

			if(~~pos.x < 0 || ~~pos.x >= 1200) return;
			if(~~pos.y < 0 || ~~pos.y >= 1000) return;
			
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

				board[key] = board[moveSelected];
				delete board[moveSelected];
				
				api("MovePixel", {from: moveSelected, to: key}, function(resp) {
					if(resp.error) {
						showError(resp.error);
						board[moveSelected] = board[key];
						delete board[key];
					}

					status();
				}, false);
				
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
	
	$("a.buypixel").click(function() {
		
		//hide if opened
		if($("div.buy").is(":visible")) {
			$("div.buy").hide();
			$(this).removeClass("active");
			$(".register").unbind(":Registered");
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

		function generateReceipt() {
			//reset values
			total = 0;
			buyList = [];

			for(var pix in pixels) {
				if(pix === "length" || !pixels.hasOwnProperty(pix)) continue;
				
				var pixel = board[pix];
				var cost;
				if(pixel) {
					//if pixel for sale, add to total, else deselect
					if(pixel.cost && pixel.owner != me.userID) 
						cost = +pixel.cost;
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
				
				if(pixels.length < 10000) 
					html += "<li><b>" + pix + "</b><i>$" + (cost / 100).toFixed(2) + "</i><a class='remove'>remove</a></li>";
			}

			redraw();
			$("div.buy span.total").text((total / 100).toFixed(2));
		}
		
		generateReceipt();

		//2 dollar minimum
		if(total < 200) {
			showError("You must buy at least $2.00 worth of pixels. Currently $" + (total / 100).toFixed(2));
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

		function saveOrder() {
			$("#paypalloading").text("Loading").show();
			
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
				$("#paypalloading").hide();
			});
			
			$("input.payer").val(me.userID);
			
			$("div.buy input.amount").val((total / 100).toFixed(2));
			$("input.payeremail").val(me.userEmail);
		}
		
		if(me) {
			saveOrder();
		} else {

			$("#paypalloading").text("Please register or login in the right box");
			$(".register").show();
			//bind to custom event
			$(".register").bind(":Registered", function() {
				console.log(me, "DO i exist?", arguments);
				generateReceipt();
				saveOrder();
			});
		}
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
			if(pix === "length") continue;

			var pixel = board[pix];
			
			if(!pixel || pixel.owner != me.userID) {
				delete pixels[pix];
				pixels.length--;
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
		
		if(value < 0.01 || value > 5.0 || isNaN(value)) {
			showError("Value must be between $0.01 and $5.00");
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

	$("a.zoomin").click(function() {
		//increase zoom by power of 2
		if(zoomLevel === 64) return;

		var newZoom = zoomLevel * 2;
		var width = (1200 / newZoom) / 2;
		var height  = (1000 / newZoom) / 2;
		var midPointX = zoomPos.left + (1200 / zoomLevel / 2);
		var midPointY = zoomPos.top + (1000 / zoomLevel / 2);
		var x = midPointX - width;
		var y = midPointY - height;

		console.log(newZoom, width, height, midPointX, midPointY, x, y)
		if(x < 0) x = 0;
		if(y < 0) y = 0;
		if(x > 1200 - 1200 / newZoom) x = 1200 - 1200 / newZoom;
		if(y > 1000 - 1000 / newZoom) y = 1000 - 1000 / newZoom;

		drawZoom(~~x, ~~y, newZoom);
	});

	$("a.zoomout").click(function() {
		//decrease zoom by power of 2
		if(zoomLevel === 1) return;

		var newZoom = zoomLevel / 2;
		if(newZoom === 1) {
			drawBoard();
			return;
		}

		var width = (1200 / newZoom) / 2;
		var height  = (1000 / newZoom) / 2;
		var midPointX = zoomPos.left + (1200 / zoomLevel / 2);
		var midPointY = zoomPos.top + (1000 / zoomLevel / 2);
		var x = zoomPos.left - (midPointX - zoomPos.left);
		var y = zoomPos.top - (midPointY - zoomPos.top);

		console.log(newZoom, width, height, midPointX, midPointY, x, y);
		if(x < 0) x = 0;
		if(y < 0) y = 0;
		if(x > 1200 - 1200 / newZoom) x = 1200 - 1200 / newZoom;
		if(y > 1000 - 1000 / newZoom) y = 1000 - 1000 / newZoom;

		drawZoom(~~x, ~~y, newZoom);
	});

	$("li.colors span").click(function(e) {
		var color = $(this).attr("data-value");

		updateColors(color);
	})
}

function updateColors(color) {
	if(!me) {
		return;
	}

	var data = {};
	data.color = color;
	data.pixels = "";
	data.POST = true;

	//loop selected pixels
	for(var pix in pixels) {
		var pixel = board[pix];
		if(!pixel || pixel.owner != me.userID) continue;

		pixel.color = color;
		data.pixels += pix + " ";
	}

	if(data.pixels.length === 0) return;

	api("ChangeColor", data);
	redraw();
}

function showTooltip(e) {
	var pos = translate(e.clientX, e.clientY);
	var pixel = board[Math.floor(pos.x) + ',' + Math.floor(pos.y)];

	if(!pixel) {
		$("#tooltip").hide();
		$("#tooltip .url, #tooltip .message, #tooltip .price").text("");
		return;
	}

	var info = owners[+pixel.owner];
	if(!info) return;
	if(mypixelsSelected && pixel.owner != me.userID) return;

	var globalPos = translateGlobal(e.clientX, e.clientY);
	$("#tooltip .message").text(info.message);
	$("#tooltip .url").text(info.url);
	$("#tooltip .price").text("$" + (pixel.cost / 100).toFixed(2));

	$("#tooltip").show().css({
		left: e.clientX + 15 + body.scrollLeft,
		top: e.clientY + body.scrollTop
	});
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
	$("#canvas, #stage").unbind("mousedown").unbind("click").unbind("mouseleave").unbind("mouseup").unbind("dblclick");
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

function stopZoomer() {
	$(zoomer).hide();
	$("#canvas").unbind("mousemove").unbind("click");
}
