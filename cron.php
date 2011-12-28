<?php
include 'ORM.php';
include 'objects/Cycle.php';
include 'objects/Pixel.php';

//grab all pixels
$q = Pixel::getAll();
$pixel = array();

//pixel counts for event lists
$pixelcount = array();

//loop over every pixel and convert to assoc array
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
	$pixel[$row['pixelLocation']] = $row;
	
	if(!isset($pixelcount[$row['ownerID']])) {
		$pixelcount[$row['ownerID']] = array("win" => 0, "lose" => 0);
	}
}

//static list of directions in a circle
$circle = array(
	array(-1, -1),
	array(-1, 0),
	array(-1, 1),
	array(0, -1),
	array(0, 1),
	array(1, -1),
	array(1, 0),
	array(1, 1)
);

//list of pixels to be updated
$modified = array();

//get the latest cycle information
$cycle = Cycle::getCurrent();

//run algorithm
foreach($pixel as $xy=>$pix) {
	$location = explode(",", $xy);
	
	$location[0] = intval($location[0], 10);
	$location[1] = intval($location[1], 10);	
	
	//grab the values of the channels
	$color = array(
		"red" => hexdec(substr($pix['color'], 0, 2)),
		"green" => hexdec(substr($pix['color'], 2, 2)),
		"blue" => hexdec(substr($pix['color'], 4, 2))
	);
	
	//calculate the score for this pixel
	$value = $color[$cycle['positive']] - $color[$cycle['negative']];
	
	foreach($circle as $dir) {
		$key = ($location[0] + $dir[0]) . "," . ($location[1] + $dir[1]);

		//skip if not in array
		if(!isset($pixel[$key])) continue;
		
		$opponent = $pixel[$key];
		
		//skip if the owners are the same
		if($pix['ownerID'] == $opponent['ownerID']) continue;
		
		//grab the opponent color values
		$ocolor = array(
			"red" => hexdec(substr($opponent['color'], 0, 2)),
			"green" => hexdec(substr($opponent['color'], 2, 2)),
			"blue" => hexdec(substr($opponent['color'], 4, 2))
		);
		
		//calculate the opponent score
		$ovalue = $ocolor[$cycle['positive']] - $ocolor[$cycle['negative']];
		
		//opponent wins
		if($ovalue > $value) {
			$modified[$xy] = $opponent;
		} //draw
		else if($ovalue === $value) {
			continue;
		} //player wins 
		else {
			$modified[$key] = $pix;
		}
	}
}

//create the SQL to modify in bulk these pixels
$rsql = "DELETE FROM pixels WHERE pixelLocation IN(";
$isql = "INSERT INTO pixels VALUES ";

//determine who lost pixels and gained pixels after cycle
//generate the sql data
foreach($modified as $xy => $pix) {
	//change the totals for the user
	$pixelcount[$pix['ownerID']]['win']++;
	$pixelcount[$pixel[$xy]['ownerID']]['lose']++;
	
	//append values for sql
	$rsql .= "'" . $xy . "', ";
	$isql .= "('{$xy}', {$pix['ownerID']}, 0, '{$pix['color']}'),";
}

//clean up sql
$rsql .= "'none')";
$isql = substr($isql, 0, strlen($isql) - 1);

$esql = "INSERT INTO events VALUES ";
foreach($pixelcount as $owner => $pix) {
	$text = "You won {$pix['win']} and lost {$pix['lose']}";
	$esql .= "({$owner}, '" . NOW() . "', '{$text}'),";
}
$esql = substr($esql, 0, strlen($esql) - 1);

ORM::query($rsql);
ORM::query($isql);
ORM::query($esql);

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
$time = time() + (2 * 60 * 60);
I("Cycle")->create(D, $pos, $neu, $neg, $hint, date('Y-m-d H:i:s', $time));
?>