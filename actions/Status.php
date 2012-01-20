<?php
load("Event");
data("time");
$logs = queryDaemon("l {$time}");

//grab the latest cycle
$q = ORM::query("SELECT * FROM cycles WHERE cycleID = (SELECT MAX(cycleID) FROM cycles)");
$cycle = $q->fetch(PDO::FETCH_ASSOC);
$cycle['cycleTime'] .= " UTC+0:00";
$cycle['cycleTime'] = strtotime($cycle['cycleTime']);

$json = array(
	"log" => $logs,
	"cycle" => $cycle,
	"time" => time()
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