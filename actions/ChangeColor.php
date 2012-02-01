<?php
load("Pixel");
data("color, pixels");

$pixels = trim($pixels);

$pix = str_replace(" ", "|", $pixels);
if(preg_match("/[^0-9,\|]/i", $pix))) {
    error("Invalid pixels");
}

//ensure color is valid
$icolor = intval($color, 16);
if($icolor < 0 || $icolor > 16777215) {
    error("Invalid color provided. {$icolor}");
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

chunk("{$pix} w {$color} . . " . time());

ok();
?>
