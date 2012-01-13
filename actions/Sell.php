<?php
load("Pixel, Transaction");
data("pixels, cost");

//detect SQL injection 
if(preg_match("/[^0-9,]/i", implode("", $pixels))) {
    error("Invalid pixels");
}

//ensure cost is a number between 1,00 and 100,00
$cost = floor(((float) $cost) * 10);
if($cost < 1 || $cost > 500) {
    error("Price must be less between $0.00 and $50");
}

$cost = dechex($cost);
$list = implode($pixels, "|");

//grab the pixels
$get = queryDaemon("{$list} g");
$data = toArray($get);

foreach($data as $pixel) {
	if($pixel['owner'] != USER) {
		error("Not your pixels (" . $pixel['owner'] . ") vs (" . USER . ")");
	}
}

queryDaemon("{$list} w . {$cost} . " . time());

ok();
?>
