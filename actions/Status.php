<?php
load("Pixel");

$q = ORM::query("SELECT * FROM cycles WHERE cycleID = (SELECT MAX(cycleID) FROM cycles)");
$data = $q->fetch(PDO::FETCH_ASSOC);

echo json_encode($data);
?>