<pre>
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

$time = "2.5235";

if(preg_match("/[^0-9]/i", $time)) {
	echo("Invalid time");
}
?>
</pre>