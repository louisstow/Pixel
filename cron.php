<?php
include 'ORM.php';
include 'objects/Cycle.php';

$enum = array("red", "green", "blue");
$type = array("positive", "neutral", "negative");

//choose positive
$pi = rand(0, 2);
$pos = $enum[$pi];
array_splice($enum, $pi, 1);

//choose neutral
$ni = rand(0, 1);
$neu = $enum[$ni];
array_splice($enum, $ni, 1);

//choose negative
$neg = $enum[0];

//choose which detail to hint
$ti = rand(0, 2);
$hint = $type[$ti];

//when the cycle starts
$time = time() + (4 * 60 * 60);
I("Cycle")->create(D, $pos, $neu, $neg, $hint, date('Y-m-d H:i:s', $time));
?>