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

function chooseDominant($color) {
	//find the dominant pixel
	if($color['red'] > $color['green'] && $color['red'] > $color['blue']) {
		$dominant = "red";
	} else if($color['green'] > $color['red'] && $color['green'] > $color['blue']) {
		$dominant = "green";
	} else if($color['blue'] > $color['red'] && $color['blue'] > $color['green']) {
		$dominant = "blue";
	} else {
		//no dominant color found, see if they are all the same
		if($color['red'] == $color['green'] && $color['red'] == $color['blue']) {
			$dominant = $color[rand(0, 2)];
		} else if($color['red'] == $color['green']) {
			$dominant = rand(0, 1) == 1 ? "red" : "green";
		} else if($color['blue'] == $color['green']) {
			$dominant = rand(0, 1) == 1 ? "blue" : "green";
		} else if($color['red'] == $color['blue']) {
			$dominant = rand(0, 1) == 1 ? "red" : "blue";
		} else {
			//will never get here, but what the hell
			$dominant = "red";
		}
	}
	
	return $dominant;
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

//which color beats which
$order = array(
	"red" => "green",
	"green" => "blue",
	"blue" => "red"
);

//list of pixels to be updated
$modified = array();

//get the latest cycle information
$cycle = Cycle::getCurrent();

//take away immunity for these pixels
$immune = array();

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
	
	$dominant = chooseDominant($color);
	$odds = 0; //start the odds at 0 out of 1000
	
	foreach($circle as $dir) {
		$key = ($location[0] + $dir[0]) . "," . ($location[1] + $dir[1]);

		//skip if not in array
		if(!isset($pixel[$key])) continue;
		
		//cache the current pixel or opponent
		$opponent = $pixel[$key];
		
		//skip if the owners are the same
		if($pix['ownerID'] == $opponent['ownerID']) continue;
		
		//if the opponent has immunity, skip but take away
		if($opponent['immunity']) {
			$immune[] = $key;
			continue;
		}
		
		//grab the opponent color values
		$ocolor = array(
			"red" => hexdec(substr($opponent['color'], 0, 2)),
			"green" => hexdec(substr($opponent['color'], 2, 2)),
			"blue" => hexdec(substr($opponent['color'], 4, 2))
		);
		
		//calculate the opponent score
		$odominant = chooseDominant($ocolor);
		
		//if the players dominant color beats the opponent
		if($order[$dominant] == $odominant) {
			$odds += 600;
		}
		
		//better odds if big difference between channel colors
		$odds += floor((abs($color[$dominant] - $color['red']) + abs($color[$dominant] - $color['green']) + abs($color[$dominant] - $color['blue'])) / 4) ;
		
		//player wins if beat odds, else draw
		if(rand(0, 1000) < $odds) {
			$modified[$key] = $pix;
		} else {
			continue;
		}
	}
}

//create the SQL to modify in bulk these pixels
$rsql = "DELETE FROM pixels WHERE pixelLocation IN(";
$isql = "INSERT INTO pixels VALUES ";

$rprep = array();
$iprep = array();

//determine who lost pixels and gained pixels after cycle
//generate the sql data
foreach($modified as $xy => $pix) {
	//change the totals for the user
	$pixelcount[$pix['ownerID']]['win']++;
	$pixelcount[$pixel[$xy]['ownerID']]['lose']++;
	
	//append values for sql
	$rsql .= "?,";
	$rprep[] = $xy;
	
	$isql .= "(?, ?, 5000, ?, 0),";
	$iprep[] = $xy;
	$iprep[] = $pix['ownerID'];
	$iprep[] = $pix['color'];
}

print_r($modified);

//clean up sql
$rsql = substr($rsql, 0, strlen($rsql) - 1) .  ")";
$isql = substr($isql, 0, strlen($isql) - 1);

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

ORM::query($rsql, $rprep);
ORM::query($isql, $iprep);
ORM::query($esql, $eprep);

//take away immunity for pixels that just used it
$isql = "UPDATE pixels SET immunity = 'false' WHERE pixelLocation IN(";
$isql .= str_repeat("?,", count($immune));
$isql = substr($isql, 0, strlen($isql) - 1) . ")";

ORM::query($isql, $immune);

//when the cycle starts
$time = time() + (2 * 60 * 60);
I("Cycle")->create(D, date('Y-m-d H:i:s', $time));
?>
