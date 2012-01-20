<?php
include 'lib.php';
include 'ORM.php';

if(!isset($_GET['key'])) {
	die("Invalid key");
}

$key = $_GET['key'];

$q = ORM::query("SELECT userID FROM passchange WHERE renewkey = ?", array($key));
$data = $q->fetch(PDO::FETCH_ASSOC);

if(!$data) {
	die("Invalid key");
}

$pass = rand(000000, 999999);
$encpass = encrypt($pass);
ORM::query("UPDATE users SET userPass = ? WHERE userID = ?", array($encpass, $data['userID']));
ORM::query("DELETE FROM passchange WHERE userID = ?", array($data['userID']));
?>
<h1>Your new password</h1>
<p>Please login to <a href="http://pixenomics.com">Pixenomics</a> immedietly and change your password by clicking the Details button.</p>

<p>Your password is the set of digits below:</p>

<?php
echo "<p><strong>" . $pass . "</strong></p>";
?>