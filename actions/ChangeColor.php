<?php
load("Pixel");
data("color, pixels");

$pix = implode($pixels, "','");
if(preg_match("/[^0-9,]/i", implode("", $pixels))) {
    error("Invalid pixels");
}

//ensure color is valid
$icolor = intval($color, 16);
if($icolor < 0 || $color > 16777215) {
    error("Price must be less between $1 and $100");
}

$color = dechex($icolor);
$color = str_repeat("0", 6 - strlen($color)) . $color;

ORM::query("UPDATE pixels SET color = ? WHERE pixelLocation IN('{$pix}') AND ownerID = ?", 
	array($color, USER));
	
ok();
?>
