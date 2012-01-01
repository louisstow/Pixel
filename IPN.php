<?php
include 'lib.php';
include 'ORM.php';
load("User, Event, Transaction");

$_POST = $_GET;
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
/*$fp = fsockopen('ssl://www.sandbox.paypal.com', 443, $errno, $errstr, 30);
//$fp = fsockopen('ssl://ipnpb.paypal.com', 443, $errno, $errstr, 30);
if (!$fp) {
    // HTTP ERROR
    die("HTTP ERROR");
}

fputs($fp, $header . $req);
while(!feof($fp)) $res = fgets($fp, 1024);

//$res should be "VERIFIED" else explode
if($res != "VERIFIED") {
	//log error
	exit;
}*/

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

//loop over every specified pixel and double check
foreach($pixels as $pix) {
    //skip if not for sale
	if(isset($result[$pix])) {
		$pixel = $result[$pix];
		
		//increase the total cost
		if($pixel['cost'] === 0) continue;
		$cost += $pixel['cost'];
		$p = $pixel['cost'];
		
		//map of owners to sold for event data
		if(!isset($owners[$pixel['ownerID']])) {
			$owners[$pixel['ownerID']] = 0;
		}
		
		$owners[$pixel['ownerID']]++;
		
		//update the creddit
		User::updateCredit($pixel['ownerID'], $p);
	} else {
		$cost += 10;
		$p = 10;
    }
	
    $isql .= "(?, ?, 0, 'ffffff', ?),";
	$dsql .= "?,";
	
	$dprep[] = $pix;
	$iprep[] = $pix;
	$iprep[] = $_POST['payer_id'];
	$iprep[] = $p;
}

//if the price was incorrect
if(($_POST['mc_gross'] - ($cost / 100)) < -0.01) {
	//log this
	echo "PRICE IM HIGH" . $cost . "|" . $_POST['mc_gross'];
	exit;
}


$dsql = substr($dsql, 0, strlen($dsql) - 1) . ")";
$isql = substr($isql, 0, strlen($isql) - 1);

ORM::query($dsql, $dprep);
ORM::query($isql, $iprep);

//log as events
$count = count($dprep);
I("Event")->create($_POST['payer_id'], NOW(), "You bought {$count} pixels");

foreach($owners as $id => $count) {
	I("Event")->create($id, NOW(), "You bought {$count} pixels");
}

echo $isql;
echo "<br>";
echo $dsql;
echo "<br>";
echo $cost;

?>