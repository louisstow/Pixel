<?php
load("Pixel, Transaction");
data("pixels");

//check for sql injection
if(preg_match("/[^0-9,]/i", implode($pixels, ""))) {
    error("Invalid pixels");
}

$list = implode($pixels, "','");

//grab all the pixels
$sql = "SELECT * FROM pixels WHERE pixelLocation IN('{$list}')";
$q = ORM::query($sql);
$result = array();

while($row = $q->fetch(PDO::FETCH_ASSOC)) $result[] = $row;

//loop over pixels
$cost = 0;
$usql = "UPDATE SET ownerID = ? WHERE pixelLocation IN('";
$inloc = array();

$len = 0;

//loop over every specified pixel and double check
foreach($result as $pixel) {
    //skip if not for sale
    if($pixel['cost'] === 0) continue;
    
    $len++;
    
    $cost += $pixel['cost'];
    $inloc[] = $pixel['pixelLocation'];
}

$usql .= implode($inloc, "','") . "')";

echo $usql;
echo $cost;

//check price of every pixel, if not for sale skip, if not exists 1
//add up total
//change owner of pixels
?>
