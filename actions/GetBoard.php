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

echo json_encode(array("pixels" => $results, "owners" => $owners));
?>