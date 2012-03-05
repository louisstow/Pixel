function backup() {
	var bucket = {};
	var pixel;
	
	for(var pix in board) {
		pixel = board[pix];
		var key = pixel.color + "," + pixel.owner.toString(16);
		
		//skip broken pixels
		if(isNaN(pixel.owner) || pixel.color.indexOf(".") != -1) continue;
		
		if(!bucket[key]) bucket[key] = [];
		
		bucket[key].push(pix);
	}
	
	var output = [];
	var php = "$data = array("
	for(var buck in bucket) {
		var comp = buck.split(",");
		var str = bucket[buck].join("|") + " w " + comp[0] + " 1f4 " + comp[1] + " 123892350";
		
		php += "\"" + str + "\",";
	}
	
	php = php.substring(0, php.length - 1);
	php += ");";
	
	return php;
}