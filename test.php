<?php
function validate($pixels, $rep = true) {
	$pix = trim($pixels);
	
	if(strlen($pix) === 0) {
		echo("Invalid pixels");
	}
	
	if($rep) {
		$pix = preg_replace("/\s+/", "|", $pixels);
	}
	
	if(preg_match("/[^0-9,\|\s]/i", $pix)) {
		echo("Invalid pixels");
	}
	
	$pix = trim($pix, "|");
	
	return $pix;
}

echo validate("") . "<br>";
echo validate("0,,0 0") . "<br>";
echo validate("    ") . "<br>";
echo validate("0,0 0,1", false) . "<br>";
?>