<?php
load("Pixel, Event");

$data = Pixel::getAll();

$results = array();
$owners = array();

//loop over every pixel and convert to JSON
while($row = $data->fetch(PDO::FETCH_ASSOC)) {
	$results[$row['pixelLocation']] = array("color" => $row['color'], "owner" => $row['ownerID']);
	if($row['cost'] > 0) {
		$results[$row['pixelLocation']]['cost'] = $row['cost'] / 100;
	}
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

$cycle['cycleTime'] .= " UTC+10:00";

$json = array(
    "pixels" => $results, 
    "owners" => $owners, 
    "cycle" => $cycle
);

//if logged in, list event data
if(isset($_SESSION['id'])) {
    $q = Event::getLatest(USER);
    $events = array();
    while($row = $q->fetch(PDO::FETCH_ASSOC)) {
        $events[] = $row['event'];
    }

    $json['events'] = $events;
}

echo json_encode($json);
?>
