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
        $events[] = $row;
    }

    $json['events'] = $events;
}

echo json_encode($json);
?>
