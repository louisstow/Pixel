<!DOCTYPE html>
<html>
<head>
	<link href="assets/global.css" type="text/css" rel="stylesheet" />
	<link href='http://fonts.googleapis.com/css?family=Droid+Sans:400,700' rel='stylesheet' type='text/css'>
	<link rel="icon" type="image/png" href="favicon.png" />
	

	<script src="assets/jquery.min.js" type="text/javascript"></script>
	<script src="assets/jquery.timeago.js" type="text/javascript"></script>
	<script src="assets/controls.js" type="text/javascript"></script>
	<script src="assets/canvas.js" type="text/javascript"></script>
	<script src="assets/pixel.js" type="text/javascript"></script>
	<script src="assets/html5slider.js" type="text/javascript"></script>

	<title>Pixenomics - Start your pixel empire</title>
	<script type="text/javascript">

	var _gaq = _gaq || [];
	_gaq.push(['_setAccount', 'UA-28400983-1']);
	_gaq.push(['_trackPageview']);

	(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	})();

	</script>
</head>
<body>

<div id="dialog"></div>

<div id="container">

<div id="controls" class="menu">
	<ul>
		<li><a class="instructions"><u>I</u>nstructions</a></li>
		<li><a class="mypixels"><u>M</u>y Pixels</a></li>
		<li><a class="buypixel"><u>B</u>uy</a></li>
		<li><a class="sellpixel">S<u>e</u>ll</a></li>
		<li><a class="invert">Inver<u>t</u></a></li>
		<li><a class="about" href="about.php">About</a></li>
		
		<li id="welcome">Register now for your FREE 30 pixels!</li>
	</ul>

</div>

<div id="top">

	<div id="details">
		<a id="login">Login</a>
		<a id="register">Register</a>
		<a id="lostp">Lost Password</a>
		
		<span id="money" title="You will be paid via PayPal once your money reaches $20."></span>
		<a id="events">Events</a>
		<a id="change">Details</a>
		<a id="logout">Logout</a>
	</div>

	<div id="hint">
	Cycle <span class="num"></span> -
	Next cycle in <span class="hours"></span> <span class="minutes"></span> <span class="seconds"></span>.
	</div>

	<div id="tools" class="menu">
		<ul>
			<li><a class="zoomin">+</a></li>
			<li><a class="zoomlevel">1</a></li>
			<li><a class="zoomout">-</a></li>
			<li class="seperator">|</li>
			<li><a class="default"><u>D</u>efault</a></li>
			<li><a class="select"><u>S</u>elect<span id="counter"></span></a>
				<ul>
					<li><a class="selectmypixels">Select My Pi<u>x</u>els</a></li>
					<li><a class="clearselection"><u>C</u>lear Selection</a></li>
				</ul>
			</li>

			<li><a class="move">Mo<u>v</u>e</a></li>
			<li>
				<a class="swatch">Colo<u>r</u></a>
				<ul>
					<li class="colors">
						<span class="pink" data-value="FFABAB"></span>
						<span class="red" data-value="ED0000"></span>
						<span class="darkred" data-value="8F0000"></span>
						<span class="purple" data-value="9700BD"></span>					
						<span class="yellow" data-value="FFFB03"></span>
						<span class="gold" data-value="BDBA00"></span>
						<span class="orange" data-value="FFA200"></span>
						<span class="green" data-value="50DB00"></span>
						<span class="darkgreen" data-value="0B7046"></span>
						<span class="blue" data-value="0040FF"></span>
						<span class="darkblue" data-value="02299E"></span>
						<span class="brown" data-value="946000"></span>
						<span class="grey" data-value="CCCCCC"></span>
						<span class="darkgrey" data-value="777777"></span>
						<span class="black" data-value="000000"></span>
						
					</li>
				</ul>
			</li>
		</ul>
	</div>
	
	<h1><img src="assets/images/logo.png" alt="Pixenomics" /></h1>

<div class="box lostpass">
<label>Email: <input type="text" class="email" /></label>
<p class="important">An email will be sent to the provided address with a new password. Login and change it as soon as you recieve it. Contact support if
the email does not appear.</p>
<button>Recover</button>
</div>
	
<div class="box login">
	<label>Email: <input type="text" class="email" /></label>
	<label>Password: <input type="password" class="pass" /></label>
	<button>Login</button>
</div>

<div class="box register">

	<div class="register_col_l">
		<h3>1. Login details</h3>
		<label>Email: <input type="text" class="email" /><br /><br />
		<span class="important">This email address must be tied to PayPal to recieve payments</span></label>
		<label>Password: <input type="password" class="pass" /></label>

		<h3>2. Pixel Properties</h3>
		<label>Link: <input type="text" class="url" /></label>
		<label>Message: <input type="text" class="message" /></label>
		
		<span>Promotional information for your pixels.</span>
	</div>

	<div class="register_col_r">
		<h3>3. Verification</h3>
		<?php
		include 'recaptchalib.php';
		$publickey = "6Ldq1ssSAAAAAIjRnrdLG6NPlR-C4-T5zzapct4N"; // you got this from the signup page
		echo recaptcha_get_html($publickey);
		?>
		<button>Register</button>
	</div>
	<div class="clearer">&nbsp;</div>
	
</div>

<div class="box events">

</div>

<div class="box change">
<label>URL: <input type="text" class="url" /></label>
<label>Hover Text: <input type="text" class="message" /></label>
<label>Old Password: <input type="password" class="old" /></label>
<span class="important">Enter your old password if you want a new password, else leave both fields blank.</span>
<label>New Password: <input type="password" class="newp" /></label>
<button>Change</button>
</div>

<div class="box sell">
<h2>Sell pixels</h2>
<input type="range" min="0.01" max="5.00" class="slider" value="0.1" step="0.01" /><br />$<input type="text" class="display" value="0.10" />
<p><button class="sellb">Sell</button></p>
</div>

<div class="box buy">

<h2>Buy pixels</h2>

<div class="list">
<ul></ul>
</div>

<p><strong>Total: $<span class="total"></span></strong></p>

<p>By purchasing these pixels I agree to the <a href="terms.html" target="_blank">terms and conditions</a></p>

<form action="https://www.paypal.com/cgi-bin/webscr" method="post">
<input type="hidden" name="cmd" value="_xclick" />
<input type="hidden" name="business" value="jgs@pixenomics.com" />
<input type="hidden" name="amount" class="amount" value="" />
<input type="hidden" name="item_number" class="item" value="" />
<input type="hidden" name="item_name" value="Pixels at Pixenomics" />
<input type="hidden" name="payer_id" class="payer" value="" />
<input type="hidden" name="payer_email" class="payeremail" value="" />
<input type="hidden" name="no_shipping" value="1" />
<input type="hidden" name="currency_code" id="currency_code" value="USD" />
<input type="hidden" name="return" value="http://pixenomics.com/complete.html" />
<input type="image" src="https://www.paypalobjects.com/en_AU/i/btn/btn_buynowCC_LG.gif" border="0" id="paypal" name="submit" alt="PayPal — The safer, easier way to pay online.">
<div id="paypalloading"></div>
</form>

</div>

<div class="box instr">
<h2>How to play</h2>

<p class="feature">Pixenomics is the game of pixel ownership; by force or by wealth. Start your empire with <strong>30 free pixels</strong> and take over neighbouring pixels by strategically choosing a
color. You can then sell your pixels for real money or use them as advertising space.</p>

<p>The countdown displays the time until the next cycle where your pixels fight it out against others. After a cycle you will recieve a summary of how many pixels you
won or lost under 'Events'.</p>

<p>To invade a neighbouring pixel you need to increase your odds by choosing a dominant color channel that can beat the opponent's dominant color channel. 
Each color is made up of different amounts of Red, Green and Blue (we call these color channels). If your color is mostly Red, its dominant color channel
will be Red. If your color channels are the same value, it will randomly choose a dominant channel.</p>

<p><span class="red">Red</span> beats <span class="green">Green</span>, <span class="blue">Blue</span> beats <span class="red">Red</span> and 
<span class="green">Green</span> beats <span class="blue">Blue</span> (similar to Paper, Scissors, Rock).</p>

<p>Your odds will be increased by having a large difference between the dominant color channel and the other channels.</p>
</div>

</div>

<div id="tooltip">
<span class="message"></span>
<span class="url"></span> <span class="toolhelp">(Shift + Click)</span>
<span class="price"></span>
</div>

<div id="stage">

<canvas id="canvas" width="1200" height="1000">
	<p class="browser">To use Pixenomics, please update or switch your browser to one of the following: Chrome, Firefox, Opera, IE10</p>
</canvas>
</div>
<div id="footer">&copy; Pixenomics 2012 - 

Contact
<a href="mailto:saul@pixenomics.com">Saul</a> or
<a href="mailto:jgs@pixenomics.com">Jim</a> - 
<a href="http://twitter.com/pixenomics">@Pixenomics</a> - 
<a href="http://pixenomics.tumblr.com">Blog</a> - 
<a href="http://reddit.com/r/pixenomics">/r/pixenomics</a>

<p><a href="terms.html">Terms &amp; Conditions</a></p>
<p>
<a href="https://www.iubenda.com/privacy-policy/648820" class="iubenda-white " id="iubenda-embed" title="Privacy Policy">Privacy Policy</a>
<script type="text/javascript">(function (w,d) {var loader = function () {var s = d.createElement("script"), tag = d.getElementsByTagName("script")[0]; s.src = "https://cdn.iubenda.com/iubenda.js"; tag.parentNode.insertBefore(s,tag);}; w.addEventListener ? w.addEventListener("load", loader, false) : w.attachEvent("onload", loader);})(window, document);</script>
</p>
</div>

</div>

</body>

</html>
