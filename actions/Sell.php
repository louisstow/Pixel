<?php
load("Pixel, Transaction");
data("pixels, cost");

$pix = validate($pixels);

//ensure cost is a number between 1,00 and 50,00
$cost = (float) $cost;
if($cost < 0.01 || $cost > 5.00) {
    error("Price must be between $0.01 and $5");
}

$cost = dechex($cost * 100);

//grab the pixels
$get = chunk("{$pix} g");
$data = toArray($get);

foreach($data as $pixel) {
	if($pixel['owner'] != USER) {
		error("Not your pixels");
	}
	
	if($pixel['cost'] == 0) {
		error("Pixels are still pending payment.");
	}
}

chunk("{$pix} w . {$cost} . " . getTime());

ok();
?>
