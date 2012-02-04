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

$pixs = explode(" ", "0,0    0,0 ");
print_r($pixs);
echo implode($pixs, "|");
echo "<br>";
echo preg_replace("/\s+/", " ", "0,0    0,0 ");
?>
</pre>