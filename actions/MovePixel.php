<?php
load("Pixel");
data("from, to");

$sql = "UPDATE pixels SET pixelLocation = ? WHERE pixelLocation = ? AND ownerID = ?";
ORM::query($sql, array($to, $from, USER));

ok();
?>