<?php
include 'lib.php';
include 'ORM.php';
load("User, Event, Stat");
$TO = "saul+payment@pixenomics.com";

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
if($GLOBALS['paypal'] == "sandbox") {
	$fp = fsockopen('ssl://www.sandbox.paypal.com', 443, $errno, $errstr, 30);
} else {
	$fp = fsockopen('ssl://ipnpb.paypal.com', 443, $errno, $errstr, 30);
}

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

if($_POST['receiver_email'] !== "jgs@pixenomics.com") {
	$message = print_r($_POST, true) . "\r\n";
	
	mail($TO, "Not sent to us", $message);
	exit;
}

//if not pending and not complete
if($_POST['payment_status'] !== "Completed" && $_POST['payment_status'] !== "Pending") {
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
unset($q);

if(!$data) {
	//log error
	$message = print_r($_POST, true) . "\r\n";
	
	mail($TO, "Invalid user or order ID", $message);
	exit;
}

$user = (int) $data['userID'];

$pixels = explode(' ', $data['pixels']);

unset($data['pixels']);

//grab pixels
$list = implode($pixels, "|");
$result = chunk("{$list} g");
$result = toArray($result);

$cost = 0;

$owners = array();
$profit = 0;

$i = 0;
$count = 0;

$ownerList = array();

//loop over every specified pixel and double check
foreach($pixels as $pix) {
    //skip if not for sale
	if(isset($result[$i]) && $result[$i] !== false) {
		$pixel = $result[$i];
		
		//skip if pending
		if($pixel['cost'] == 0) {
			unset($pixels[$pix]);
			continue;
		}
		
		//increase the total cost
		$cost += $pixel['cost'];
		$p = $pixel['cost'];
		
		//map of owners to sold for event data
		if(!isset($owners[$pixel['owner']])) {
			$owners[$pixel['owner']] = array("sold" => 0, "credit" => 0);
			$ownerList[] = $pixel['owner'];
		}
		
		$owners[$pixel['owner']]['sold']++;
		$owners[$pixel['owner']]['credit'] += floor($p * 0.75);
		
		$profit += ceil($p * 0.25); //minus 3% for paypal fees
		$count++;
	} else {
		$cost += 10;
		$p = 10;
		$profit += 10;
		$count++;
    }

	$i++;
}

//rebuild the list
$list = implode($pixels, "|");

//payment wasn't completed
if($_POST['payment_status'] === "Pending") {
	chunk("{$list} w AAAAAA 0 {$huser} " . time());
	exit;
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
	//$message .= print_r($data, true) . "\r\n";
	$message .= $cost;
	
	mail($TO, "Incorrect price", $message);
	//User::updateCredit($user, ($_POST['mc_gross'] * 100));
	exit;
} //paid too much, credit the difference
else if(($_POST['mc_gross'] - ($cost / 100)) > 0.01) {
	$message = print_r($_POST, true) . "\r\n";
	//$message .= print_r($data, true) . "\r\n";
	$message .= "Paid: " . $cost . "\r\n";
	$message .= "Gave: " . (($_POST['mc_gross'] * 100 - $cost) - $_POST['mc_fee'] * 100) . "\r\n";
	
	mail($TO, "Too much", $message);
	
	$profit += $_POST['mc_fee'] * 100;
	User::updateCredit($user, min(0, ($_POST['mc_gross'] * 100 - $cost) - $_POST['mc_fee'] * 100));
}

//update the pixel data
$huser = dechex($user);

chunk("{$list} w AAAAAA 1f4 {$huser} " . time());

//give the pixels immunity
chunk("{$list} m immunity 1");

//our profit will be deducted by the fee
$profit -= ($_POST['mc_fee'] * 100);
Stat::updateProfit($profit);

//log as events
I("Event")->create($user, NOW(), 0, "You bought {$count} pixels");

$ownerList = implode($ownerList, ",");
$q = ORM::query("SELECT userID, userEmail FROM users WHERE userID IN({$ownerList})");
$ownerEmails = array();
while($row = $q->fetch(PDO::FETCH_ASSOC)) $ownerEmails[(int) $row['userID']] = $row['userEmail'];

$message  = "Congrats! You sold some pixels. Your account has been \r\ncredited and will be sent to you via PayPal.\r\n\r\n";
$message .= "Visit http://pixenomics.com to see your account balance.\r\n\r\n";
$message .= "Thanks,\r\nThe Pixenomics Team";
$header = "From: Pixenomics <noreply@pixenomics.com>";

foreach($owners as $id => $data) {
	I("Event")->create($id, NOW(), 0, "You sold {$data['sold']} pixels");
	//update the credit
	User::updateCredit($id, $data['credit']);
	
	mail($ownerEmails[$id], "You sold {$data['sold']} pixels - Pixenomics", $message, $header);
}

//remove the order
ORM::query("DELETE FROM orders WHERE orderID = ?", array($_POST['item_number']));

//send a payment email as a log of the transaction
//$message = print_r($data, true) . "\r\n";
$message = print_r($_POST, true) . "\r\n";
$message .= "Profit: {$profit}\r\n";
$message .= "{$list} w AAAAAA 1f4 {$huser} " . time() . "\r\n";

mail($TO, "Pixels bought", $message);
?>