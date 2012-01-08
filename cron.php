<?php
include 'ORM.php';
include 'objects/Cycle.php';
include 'objects/Pixel.php';

//get the latest cycle information
$cycle = Cycle::getCurrent();

//start the daemon cron job and get a summary
$owners = queryDaemon("c");
/*
1,0,2|5,1,3|
*/

//generate event SQL
$esql = "INSERT INTO events VALUES ";
foreach($pixelcount as $owner => $pix) {
	$text = "You won {$pix['win']} and lost {$pix['lose']}";
	$esql .= "(?, ?, ?),";
	
	$eprep[] = $owner;
	$eprep[] = NOW();
	$eprep[] = $text;
}

$esql = substr($esql, 0, strlen($esql) - 1);

ORM::query($esql, $eprep);


//when the cycle starts
$time = time() + (3 * 60 * 60);
I("Cycle")->create(D, date('Y-m-d H:i:s', $time));
?>
