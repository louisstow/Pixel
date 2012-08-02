<?php
load("Pixel");
data("color, pixels");

$pix = validate($pixels);

//ensure color is valid
$icolor = intval($color, 16);
if($icolor < 0 || $icolor > 16777215) {
    error("Invalid color provided. {$icolor}");
}

$color = dechex($icolor);
$color = str_repeat("0", 6 - strlen($color)) . $color;

$q = chunk("{$pix} g");
$data = toArray($q);

//validate the owner of the pixel
foreach($data as $row) {
	if($row['owner'] != USER) {
		error("This is not your pixel [{$row['owner']}] vs (" . USER . ") " . json_encode($data));
	}
}

chunk("{$pix} w {$color} . . " . time());

ok();
?>
