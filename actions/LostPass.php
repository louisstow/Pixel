<?php
data("email");

$q = ORM::query("SELECT userID FROM users WHERE userEmail = ?", array($email));
$data = $q->fetch(PDO::FETCH_ASSOC);

if(!$data) {
	ok();
	exit;
}

$key = md5(time());

ORM::query("INSERT INTO passchange VALUES (:id, :key, NOW()) ON DUPLICATE KEY UPDATE renewkey = :key, setupDate = NOW()", 
	array("id" => $data['userID'], "key" => $key));

$message  = "Here is a link to renew your password for the {$email} account at Pixenomics:\r\n\r\n";
$message .= "http://pixenomics.com/renew.php?key={$key}\r\n\r\n";
$message .= "Please click the link for a random password then login to your account at http://pixenomics.com and change your password immediately!\r\n\r\n";
$message .= "Thanks,\r\nThe Pixenomics Team";
$header = "From: Pixenomics <noreply@pixenomics.com>";

mail($email, "Forgotten Password - Pixenomics", $message, $header);

ok();
?>