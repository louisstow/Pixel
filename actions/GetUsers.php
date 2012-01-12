<?php
data("owners");

if(!isset($owners)) {
	echo "[]";
	exit;
}

$sql = "SELECT userID, url, message FROM users WHERE userID IN(";
$sql .= str_repeat("?,", count($owners)) . "0)";

$q = ORM::query($sql, $owners);

$result = array();
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
	$result[] = $row;
}

echo json_encode($result);
?>