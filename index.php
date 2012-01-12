<html>
<head>
<link href="assets/global.css" type="text/css" rel="stylesheet" />
<link rel="stylesheet" media="screen" type="text/css" href="assets/colorpicker/css/colorpicker.css" />
<!--<link href='http://fonts.googleapis.com/css?family=Geo' rel='stylesheet' type='text/css'>-->

<script src="api.php?action=GetBoard" type="text/javascript"></script>
<script src="assets/jquery.min.js" type="text/javascript"></script>
<script type="text/javascript" src="assets/colorpicker/js/colorpicker.js"></script>
<script src="assets/pixel.js" type="text/javascript"></script>
<script src="assets/html5slider.js" type="text/javascript"></script>

<title>Pixenomics</title>
</head>
<body>
<div id="dialog"></div>

<div id="top">
<h1>Pixenomics</h1>

<div id="details" class="right">
	<a id="login">Login</a>
	<a id="register">Register</a>
	<span id="welcome"></span>
	<span id="money" title="You will be paid via PayPal once your money reaches $20."></span>
	<a id="events">Events</a>
	<a id="change">Details</a>
	<a id="logout">Logout</a>
</div>

<div id="hint">
Next cycle in <span class="hours"></span> <span class="minutes"></span> <span class="seconds"></span>.
</div>

<div id="controls" class="menu">
<ul>
	<li><a class="buypixel"><u>B</u>uy</a></li>
	<li><a class="sellpixel">S<u>e</u>ll</a></li>
	<li><a class="mypixels"><u>M</u>y Pixels</a></li>
	<li><a class="instructions"><u>I</u>nstructions</a></li>
</ul>
</div>


<div id="tools" class="menu">
<ul>
	<li><a class="default"><u>D</u>efault</a></li>
	<li><a class="select"><u>S</u>elect</a>
		<ul>
			<li><a class="selectmypixels">Select My Pi<u>x</u>els</a></li>
			<li><a class="clearselection"><u>C</u>lear Selection</a></li>
		</ul>
	</li>
	<li><a class="zoomin">Zoom In</a>
		<ul>
			<li><a class="x2"><u>2</u>x</a></li>
			<li><a class="x4"><u>4</u>x</a></li>
			<li><a class="x8"><u>8</u>x</a></li>
			<li><a class="x16"><u>1</u>6x</a></li>
		</ul>
	</li>
	<li><a class="move">Mo<u>v</u>e</a></li>
	<li>
		<a class="swatch">Colo<u>r</u> <span></span></a>
	</li>
</ul>
</div>

<div class="box login">
<label>Email: <input type="text" class="email" /></label>
<label>Password: <input type="password" class="pass" /></label>
<button>Login</button>
</div>

<div class="box register">
<label>Email: <input type="text" class="email" /> <span class="important">This email address must be tied to PayPal to recieve payments.</label>
<label>Password: <input type="password" class="pass" /></label>
<label>URL: <input type="text" class="url" /></label>
<label>Hover Text: <input type="text" class="message" /></label>
<label>Color: <input type="text" class="color" /></label>
<span>Select 10 pixels on the canvas to start your empire.</span>
<?php
include 'recaptchalib.php';
$publickey = "6Ldq1ssSAAAAAIjRnrdLG6NPlR-C4-T5zzapct4N"; // you got this from the signup page
echo recaptcha_get_html($publickey);
?>
<button>Register</button>
</div>

<div class="box events">
<ul></ul>
</div>

<div class="box change">
<label>URL: <input type="text" class="url" /></label>
<label>Hover Text: <input type="text" class="message" /></label>
<button>Change</button>
</div>

<div class="box sell">
<h2>Sell pixels</h2>
<input type="range" min="0.1" max="50.01" class="slider" value="0.1" step="0.1" /><br />$<input type="text" class="display" value="0.10" />
<p><button class="sellb">Sell</button></p>
</div>

<div class="box buy">

<h2>Buy pixels</h2>

<div class="list">
<ul></ul>
</div>

<p>Total: $<span class="total"></span></p>

<p>By purchasing these pixels I agree to the <a href="terms.html" target="_blank">terms and conditions</a></p>

<form action="https://www.paypal.com/cgi-bin/webscr" method="post">
<input type="hidden" name="cmd" value="_xclick" />
<input type="hidden" name="business" value="louisstow@gmail.com" />
<input type="hidden" name="amount" class="amount" value="" />
<input type="hidden" name="item_number" class="item" value="" />
<input type="hidden" name="item_name" value="Pixels at Pixenomics" />
<input type="hidden" name="payer_id" class="payer" value="" />
<input type="hidden" name="payer_email" class="payeremail" value="" />
<input type="hidden" name="currency_code" id="currency_code" value="USD" />
<input type="hidden" name="return" value="http://pixenomics.com/payment.html" />
<input type="image" src="https://www.paypalobjects.com/en_AU/i/btn/btn_buynowCC_LG.gif" border="0" name="submit" alt="PayPal — The safer, easier way to pay online.">
<img alt="" border="0" src="https://www.paypalobjects.com/en_AU/i/scr/pixel.gif" width="1" height="1">
</form>

</div>

<div class="box instr">
<h2>Instructions</h2>

<p>Pixenomics is the game of pixel ownership; by force or by wealth. Start your empire with 10 free pixels and take over neighbouring pixels by strategically choosing a
color. You can then sell your pixels for real money or use them as advertising space.</p>

<p>The countdown displays the time until the next cycle where your pixels fight it out against others. After a cycle you will recieve a summary of how many pixels you
won or lost under 'Events'.</p>

<p>To invade a neighbouring pixel you need to increase your odds by choosing a dominant color channel that can beat the opponent's dominant color channel. 
Each color is made up of different amounts of Red, Green and Blue (we call these color channels). If your color is mostly Red, it's dominant color channel
will be Red.</p>

<p><span class="red">Red</span> beats <span class="green">Green</span>, <span class="blue">Blue</span> beats <span class="red">Red</span> and 
<span class="green">Green</span> beats <span class="blue">Blue</span> (similar to Paper, Scissors, Rock).</p>

<p>Your odds will be increased by having a large difference between the dominant color channel and the other channels.</p>

</div>

</div>

<div id="stage">

<div id="tooltip"></div>
<canvas id="canvas" width="1200" height="1000"></canvas>
</div>
</body>
</html>
