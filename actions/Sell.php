<?php
load("Pixel, Transaction");
data("pixels, cost");

$pixels = trim($pixels);

$pix = str_replace(" ", "|", $pixels);

//detect SQL injection 
if(preg_match("/[^0-9,\|]/i", $pix)) {
    error("Invalid pixels");
}

//ensure cost is a number between 1,00 and 50,00
$cost = floor(((float) $cost) * 10);
if($cost < 1 || $cost > 500) {
    error("Price must be between $0.00 and $50");
}

$cost = dechex($cost);

//grab the pixels
$get = queryDaemon("{$pix} g");
$data = toArray($get);

foreach($data as $pixel) {
	if($pixel['owner'] != USER) {
		error("Not your pixels");
	}
}

chunk("{$pix} w . {$cost} . " . time());

ok();
?>
