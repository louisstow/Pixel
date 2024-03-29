<?php
include 'lib.php';
include 'ORM.php';
include 'objects/Cycle.php';
include 'objects/Pixel.php';
include 'MassPayment.php';

$TO = "saul+masspay@pixenomics.com";

//get the latest cycle information
$cycle = Cycle::getCurrent();

//start the daemon cron job and get a summary
$owners = queryDaemon("c");
echo "[" . $owners . "]";

$summary = explode("|", $owners);
/*
1,0,2|5,1,3|
*/

mail(
	"saul+backup@pixenomics.com",
	time(),
	file_get_contents("/var/www/html/board.js")
);

//generate event SQL
$esql = "INSERT INTO events VALUES ";
$eprep = array();

print_r($summary);
foreach($summary as $sum) {
	$line = explode(",", $sum);
	if(count($line) != 2) {
		echo "Skip cause count";
		echo count($line);
		echo "\n";
		continue;
	}

	if(intval($line[1]) >= 0) {
		$text = "You gained {$line[1]} pixels";
	} else {
		$text = "You lost {$line[1]} pixels";
	}
	
	$esql .= "(?, ?, ?, ?),";
	
	echo "User id is";
	echo intval($line[0]);
	echo "\n";

	$eprep[] = intval($line[0]);
	$eprep[] = NOW();
	$eprep[] = $cycle['cycleID'];
	$eprep[] = $text;
}

$esql = substr($esql, 0, strlen($esql) - 1);

ORM::query($esql, $eprep);

ORM::query("DELETE FROM orders WHERE DATE_ADD(orderDate, INTERVAL 1 DAY) < NOW() && response = 'waiting'");

$q = ORM::query("SELECT userID, userEmail, money FROM users WHERE money >= 2000");

$i = 0;
$r = 0;

$nvp = "&EMAILSUBJECT=Love%20Pixenomics&RECEIVERTYPE=EmailAddress&CURRENCYCODE=USD";

$req = array();
$ids = array();

while($row = $q->fetch(PDO::FETCH_ASSOC)) {
	//create empty request string
	if(!isset($req[$r])) $req[$r] = "";
	if(!isset($ids[$r])) $ids[$r] = array();
	
	//build the string
	$receiverEmail = urlencode($row['userEmail']);
	$amount = urlencode($row['money'] / 100);
	$req[$r] .= "&L_EMAIL{$i}={$receiverEmail}&L_AMT{$i}={$amount}";
	$ids[$r][] = $row['userID'];
	
	//split up requests in chunks of 100 payments
	if($i == 200) {
		$i = 0;
		$r++;
	} else {
		$i++;
	}
}

print_r($req);

//send seperate payment requests
foreach($req as $i=>$r) {
	$res = MassPay($nvp . $r);
	if($res['ACK'] == "Failure") {
		$message = print_r($res, true) . "\r\n\r\n";
		$message .= print_r($req, true);
		
		mail($TO, "Sending payment failure", $message);
	} else {
		$where = implode($ids[$i], ",");
		ORM::query("UPDATE users SET money = 0 WHERE money >= 2000 AND userID IN({$where})");
	}
}


//when the cycle starts
$time = time() + (3 * 60 * 60);
I("Cycle")->create(D, date('Y-m-d H:i:s', $time));
?>
