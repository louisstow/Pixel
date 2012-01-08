<?php
load("Pixel");
data("color, pixels");

$pix = implode($pixels, "|");
if(preg_match("/[^0-9,]/i", implode("", $pixels))) {
    error("Invalid pixels");
}

//ensure color is valid
$icolor = intval($color, 16);
if($icolor < 0 || $color > 16777215) {
    error("Invalid color provided.");
}

$color = dechex($icolor);
$color = str_repeat("0", 6 - strlen($color)) . $color;

$q = queryDaemon("{$pix} g");
$data = toArray($q);

//validate the owner of the pixel
foreach($data as $row) {
	if($row['owner'] != USER) {
		error("This is not your pixel");
	}
}

queryDaemon("{$pix} w {$color} -1 " . USER . " " . time());

ok();
?>
