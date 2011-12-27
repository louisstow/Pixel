<?php
load("Pixel");

$data = Pixel::getAll();

$results = array();
$owners = array();

//loop over every pixel and convert to JSON
while($row = $data->fetch(PDO::FETCH_ASSOC)) {
	$results[$row['pixelLocation']] = array("color" => $row['color'], "owner" => $row['ownerID']);
	$owners[$row['ownerID']] = array("message" => $row['message'], "url" => $row['url']);
}

$q = ORM::query("SELECT * FROM cycles WHERE cycleID = (SELECT MAX(cycleID) FROM cycles)");
$cycle = $q->fetch(PDO::FETCH_ASSOC);

switch($cycle['hint']) {
	case "positive":
		unset($cycle['neutral']);
		unset($cycle['negative']);
		break;
	case "neutral":
		unset($cycle['positive']);
		unset($cycle['negative']);
		break;
	case "negative":
		unset($cycle['neutral']);
		unset($cycle['positive']);
		break;
}

$cycle['cycleTime'] .= date(" eP");

echo json_encode(
	array(
		"pixels" => $results, 
		"owners" => $owners, 
		"cycle" => $cycle
	)
);
?>