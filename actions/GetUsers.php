<?php
data("users");

$sql = "SELECT userID, url, message FROM users WHERE userID IN(";
$sql .= str_repeat("?,", count($users)) . "0)";

$q = ORM::query($sql, $users);

$result = array();
while($row = $q->fetch(PDO::FETCH_ASSOC)) {
	$result[] = $row;
}

echo json_encode($result);
?>