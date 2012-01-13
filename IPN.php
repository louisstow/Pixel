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

//grab pixels
$list = implode($pixels, "|");
$result = queryDaemon("{$list} g");
$result = toArray($result);

$cost = 0;

$owners = array();
$profit = 0;

$i = 0;
//loop over every specified pixel and double check
foreach($pixels as $pix) {
    //skip if not for sale
	if(isset($result[$i])) {
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
		$profit += ceil($p * 0.23); //minus 2% for paypal fees
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
	User::updateCredit($_POST['payer_id'], ($_POST['mc_gross'] * 100));
	exit;
} //paid too much, credit the difference
else if(($_POST['mc_gross'] - ($cost / 100)) > 0.01) {
	User::updateCredit($_POST['payer_id'], $_POST['mc_gross'] * 100 - $cost);
}

//update the pixel data
queryDaemon("{$list} w AAAAAA 500 {$_POST['payer_id']} " . time());

//give the pixels immunity
queryDaemon("{$list} s immunity 1");

Stat::updateProfit($profit);

//log as events
$count = count($dprep);
I("Event")->create($_POST['payer_id'], NOW(), "You bought {$count} pixels");

foreach($owners as $id => $data) {
	I("Event")->create($id, NOW(), "You sold {$data['sold']} pixels");
	//update the credit
	User::updateCredit($id, $data['credit']);
}

//send a payment email as a log of the transaction
$message = $header . "\r\n\r\n";
$message .= print_r($_POST, true) . "\r\n";

mail($TO, "Pixels bought", $message);
?>