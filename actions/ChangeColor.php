<?php
load("Pixel");
data("color, pixels");

$pix = implode($pixels, "','");

ORM::query("UPDATE pixels SET color = ? WHERE pixelLocation IN('{$pix}') AND ownerID = ?", 
	array($color, USER));
	
ok();
?>