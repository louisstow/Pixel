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
    error("Invalid color provided.");
}

$color = dechex($icolor);
$color = str_repeat("0", 6 - strlen($color)) . $color;

$sql = "UPDATE pixels SET color = ? WHERE pixelLocation IN(";
$sql .= str_repeat("?,", count($pixels));
$sql = substr($sql, 0, strlen($sql) - 1) . ")";
$sql .= " AND ownerID = ?";

$prep = array($color);
$prep = array_merge($prep, $pixels);
$prep[] = USER;

ORM::query($sql, $prep);
ok();
?>
