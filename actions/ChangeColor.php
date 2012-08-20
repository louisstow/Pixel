<?php
load("Pixel");
data("color, pixels");

$pix = validate($pixels);

$validColors = array(
	"ED0000",
	"8F0000",
	"50DB00",
	"0B7046",
	"FFA200",
	"0040FF",
	"02299E",
	"FFFB03",
	"BDBA00",
	"9700BD",
	"000000",
	"946000",
	"777777",
	"CCCCCC",
	"FFABAB"
);

if(!in_array($color, $validColors)) {
	error("Invalid color");
}

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
