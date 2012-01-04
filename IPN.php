<?php
include 'lib.php';
include 'ORM.php';
load("User, Event, Stat");
$TO = "louisstow+pixenomics@gmail.com";

// read the post from PayPal system and add 'cmd'
$req = 'cmd=_notify-validate';

foreach ($_POST as $key => $value) {
    $value = urlencode(stripslashes($value));
    $req .= "&$key=$value";
}

// post back to PayPal system to validate
$header  = "POST /cgi-bin/webscr HTTP/1.0\r\n";
$header .= "Content-Type: application/x-www-form-urlencoded\r\n";
$header .= "Content-Length: " . strlen($req) . "\r\n\r\n";

//If testing on Sandbox use:
$fp = fsockopen('ssl://www.sandbox.paypal.com', 443, $errno, $errstr, 30);
//$fp = fsockopen('ssl://ipnpb.paypal.com', 443, $errno, $errstr, 30);

if (!$fp) {
    // HTTP ERROR
	$message = $header . "\r\n\r\n";
	$message .= print_r($_POST, true) . "\r\n";
	
	mail($TO, "HTTP Error", $message);
    die("HTTP ERROR");
}

fputs($fp, $header . $req);
while(!feof($fp)) $res = fgets($fp, 1024);

//$res should be "VERIFIED" else explode
if($res != "VERIFIED") {
	//log error
	$message = $res . "\r\n";
	$message .= print_r($_POST, true) . "\r\n";
	
	mail($TO, "Invalid request", $message);
	exit;
}

$pixels = explode(' ', $_POST['item_number']);

//check for sql injection
if(preg_match("/[^0-9,]/i", implode("", $pixels))) {
    error("Invalid pixels");
}

$list = implode($pixels, "','");

//grab all the pixels
$sql = "SELECT * FROM pixels WHERE pixelLocation IN(";
$sql .= str_repeat("?,", count($pixels));
$sql = substr($sql, 0, strlen($sql) - 1) . ")";

$q = ORM::query($sql, $pixels);

$result = array();

while($row = $q->fetch(PDO::FETCH_ASSOC)) $result[$row['pixelLocation']] = $row;

//loop over pixels
$cost = 0;
$dsql = "DELETE FROM pixels WHERE pixelLocation IN(";
$isql = "INSERT INTO pixels VALUES ";

//prepared statement values
$iprep = array();
$dprep = array();

$owners = array();
$profit = 0;

//loop over every specified pixel and double check
foreach($pixels as $pix) {
    //skip if not for sale
	if(isset($result[$pix])) {
		$pixel = $result[$pix];
		
		//increase the total cost
		$cost += $pixel['cost'];
		$p = $pixel['cost'];
		
		//map of owners to sold for event data
		if(!isset($owners[$pixel['ownerID']])) {
			$owners[$pixel['ownerID']] = array("sold" => 0, "credit" => 0);
		}
		
		$owners[$pixel['ownerID']]['sold']++;
		$owners[$pixel['ownerID']]['credit'] += floor($p * 0.8);
		$profit += ceil($p * 0.2);
	} else {
		$cost += 10;
		$p = 10;
		$profit += 10;
    }
	
    $isql .= "(?, ?, 5000, 'aaaaaa', ?, 'true'),";
	$dsql .= "?,";
	
	$dprep[] = $pix;
	$iprep[] = $pix;
	$iprep[] = $_POST['payer_id'];
	$iprep[] = $p;
}

//if the price was incorrect
if(($_POST['mc_gross'] - ($cost / 100)) < -0.01) {
	$message = "";
	$message .= print_r($_POST, true) . "\r\n";
	$message .= $cost;
	
	mail($TO, "Incorrect price", $message);
	exit;
}


$dsql = substr($dsql, 0, strlen($dsql) - 1) . ")";
$isql = substr($isql, 0, strlen($isql) - 1);

ORM::query($dsql, $dprep);
ORM::query($isql, $iprep);
Stat::updateProfit($profit);

//log as events
$count = count($dprep);
I("Event")->create($_POST['payer_id'], NOW(), "You bought {$count} pixels");

foreach($owners as $id => $data) {
	I("Event")->create($id, NOW(), "You bought {$data['sold']} pixels");
	//update the credit
	User::updateCredit($pixel['ownerID'], $data['credit']);
}

//send a payment email as a log of the transaction
$message = $header . "\r\n\r\n";
$message .= print_r($_POST, true) . "\r\n";

mail($TO, "Pixels bought", $message);
?>