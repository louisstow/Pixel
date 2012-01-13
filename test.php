<?php
$str = "0000000500001";
$result = array(
	"color" => substr($str, 0, 6),
	"cost" => substr($str, 0 + 6, 3),
	"owner" => substr($str, 0 + 9, 4)
);

print_r($result);
?>