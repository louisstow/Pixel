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
//$fp = fsockopen('ssl://www.sandbox.paypal.com', 443, $errno, $errstr, 30);
$fp = fsockopen('ssl://ipnpb.paypal.com', 443, $errno, $errstr, 30);

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

//payment wasn't completed
if($_POST['payment_status'] !== "Completed") {
	//log error
	$message = $res . "\r\n";
	$message .= print_r($_POST, true) . "\r\n";
	
	mail($TO, "Not Completed", $message);
	exit;
}

//payment wasn't USD
if($_POST['mc_currency'] !== "USD") {
	//log error
	$message = print_r($_POST, true) . "\r\n";
	
	mail($TO, "Not USD", $message);
	exit;
}

$q = ORM::query("SELECT * FROM orders WHERE orderID = ?", array($_POST['item_number']));
$data = $q->fetch(PDO::FETCH_ASSOC);

if(!$data) {
	//log error
	$message = print_r($_POST, true) . "\r\n";
	
	mail($TO, "Invalid user or order ID", $message);
	exit;
}

$user = $data['userID'];

$pixels = explode(' ', $data['pixels']);

//check for sql injection
if(preg_match("/[^0-9,]/i", implode("", $pixels))) {
    $message = print_r($_POST, true) . "\r\n";
	
	mail($TO, "Invalid pixels", $message);
	exit;
}

//grab pixels
$list = implode($pixels, "|");
$result = queryDaemon("{$list} g");
$result = toArray($result);

$cost = 0;

$owners = array();
$profit = 0;

$i = 0;
$count = 0;

//loop over every specified pixel and double check
foreach($pixels as $pix) {
    //skip if not for sale
	if(isset($result[$i]) && $result[$i] !== false) {
		$pixel = $result[$i];
		
		//increase the total cost
		$cost += $pixel['cost'];
		$p = $pixel['cost'];
		
		//map of owners to sold for event data
		if(!isset($owners[$pixel['owner']])) {
			$owners[$pixel['owner']] = array("sold" => 0, "credit" => 0);
		}
		
		$owners[$pixel['owner']]['sold']++;
		$owners[$pixel['owner']]['credit'] += floor($p * 0.75);
		$profit += ceil($p * 0.25); //minus 3% for paypal fees
		$count++;
	} else {
		$cost += 10;
		$p = 10;
		$profit += 10;
    }

	$i++;
}

//if they paid under the threshold, we make no profit
if($_POST['mc_gross'] < 2) {
	$message = "";
	$message .= print_r($_POST, true) . "\r\n";
	$message .= $cost;
	
	mail($TO, "Under $2 Sale", $message);
	exit;
}

//paid too little, credit the payment
if(($_POST['mc_gross'] - ($cost / 100)) < -0.01) {
	$message = "";
	$message .= print_r($_POST, true) . "\r\n";
	$message .= $cost;
	
	mail($TO, "Incorrect price", $message);
	//User::updateCredit($user, ($_POST['mc_gross'] * 100));
	exit;
} //paid too much, credit the difference
else if(($_POST['mc_gross'] - ($cost / 100)) > 0.01) {
	$message = print_r($_POST, true) . "\r\n";
	$message .= "Paid: " . $cost . "\r\n";
	$message .= "Gave: " . (($_POST['mc_gross'] * 100 - $cost) - $_POST['mc_fee'] * 100) . "\r\n";
	
	mail($TO, "Too much", $message);
	
	$profit += $_POST['mc_fee'] * 100;
	User::updateCredit($user, min(0, ($_POST['mc_gross'] * 100 - $cost) - $_POST['mc_fee'] * 100));
}

//update the pixel data
$huser = dechex($user);
queryDaemon("{$list} w AAAAAA 1f4 {$huser} " . time());

//give the pixels immunity
queryDaemon("{$list} s immunity 1");

//our profit will be deducted by the fee
$profit -= ($_POST['mc_fee'] * 100);
Stat::updateProfit($profit);

//log as events
I("Event")->create($user, NOW(), 0, "You bought {$count} pixels");

foreach($owners as $id => $data) {
	I("Event")->create($id, NOW(), 0, "You sold {$data['sold']} pixels");
	//update the credit
	User::updateCredit($id, $data['credit']);
}

//remove the order
ORM::query("DELETE FROM orders WHERE orderID = ?", array($_POST['item_number']));

//send a payment email as a log of the transaction
$message = print_r($_POST, true) . "\r\n";
$message .= "Profit: {$profit}\r\n";

mail($TO, "Pixels bought", $message);
?>