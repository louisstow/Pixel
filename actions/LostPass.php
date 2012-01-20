<?php
data("email");

$q = ORM::query("SELECT userID FROM users WHERE userEmail = ?", array($email));
$data = $q->fetch(PDO::FETCH_ASSOC);

if(!$data) {
	error("No account with that email");
}

$pass = rand(10000, 99999);
$encpass = encrypt($pass);

ORM::query("UPDATE users SET userPass = ? WHERE userEmail = ?", array($encpass, $email));

$message  = "Here is your new password for the {$email} account at Pixenomics:\r\n\r\n";
$message .= "{$pass}\r\n\r\n";
$message .= "Please login to your account at http://pixenomics.com and change your password immediately!\r\n\r\n";
$message .= "Thanks,\r\nThe Pixenomics Team";

mail($email, "Forgotten Password - Pixenomics", $message);

ok();
?>