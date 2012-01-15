-- phpMyAdmin SQL Dump
-- version 3.4.5
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jan 15, 2012 at 05:47 AM
-- Server version: 5.5.16
-- PHP Version: 5.3.8

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `pixel`
--

-- --------------------------------------------------------

--
-- Table structure for table `cycles`
--

CREATE TABLE IF NOT EXISTS `cycles` (
  `cycleID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `cycleTime` datetime NOT NULL,
  PRIMARY KEY (`cycleID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=32 ;

--
-- Dumping data for table `cycles`
--

INSERT INTO `cycles` (`cycleID`, `cycleTime`) VALUES
(4, '2011-12-27 04:46:41'),
(5, '2011-12-27 04:46:44'),
(6, '2011-12-27 04:46:53'),
(7, '2011-12-27 04:46:59'),
(8, '2011-12-27 08:54:47'),
(9, '2011-12-27 09:11:08'),
(10, '2011-12-27 09:50:01'),
(11, '2011-12-27 19:51:24'),
(12, '2011-12-27 10:10:08'),
(13, '2011-12-28 05:15:49'),
(14, '2011-12-28 11:10:03'),
(15, '2012-01-01 15:13:08'),
(16, '2012-01-02 04:35:39'),
(17, '2012-01-02 04:36:11'),
(18, '2012-01-02 04:36:54'),
(19, '2012-01-02 04:37:39'),
(20, '2012-01-02 04:44:10'),
(21, '2012-01-02 04:44:52'),
(22, '2012-01-04 11:05:34'),
(23, '2012-01-08 07:25:11'),
(24, '2012-01-08 07:26:37'),
(25, '2012-01-08 08:04:20'),
(26, '2012-01-08 08:04:23'),
(27, '2012-01-10 07:30:22'),
(28, '2012-01-10 07:57:29'),
(29, '2012-01-10 08:17:00'),
(30, '2012-01-10 08:19:49'),
(31, '2012-01-10 08:20:12');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE IF NOT EXISTS `events` (
  `userID` int(10) unsigned NOT NULL,
  `cycleID` int(10) unsigned NOT NULL,
  `event` varchar(200) NOT NULL,
  PRIMARY KEY (`userID`,`cycleID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`userID`, `cycleID`, `event`) VALUES
(0, 29, 'You won  and lost '),
(1, 2012, 'You won 0 and lost 0'),
(2, 2012, 'You won 0 and lost 0'),
(14, 2012, 'You won 0 and lost 0'),
(16, 2012, 'You won 0 and lost 0'),
(17, 2012, 'You won 0 and lost 0');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE IF NOT EXISTS `orders` (
  `orderID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userID` int(10) unsigned NOT NULL,
  `orderDate` datetime NOT NULL,
  `pixels` longtext NOT NULL,
  PRIMARY KEY (`orderID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`orderID`, `userID`, `orderDate`, `pixels`) VALUES
(1, 1, '2012-01-15 05:40:38', '0,0 0,1 0,2 0,3 0,4 0,5 0,6 0,7 0,8 0,9 0,10 0,11 0,12 0,13 0,14 0,15 0,16 0,17 0,18 0,19 0,20 0,21 0,22 0,23 0,24 0,25 0,26 0,27 0,28 0,29 0,30 0,31 0,32 0,33 0,34 0,35 0,36 0,37 0,38');

-- --------------------------------------------------------

--
-- Table structure for table `stats`
--

CREATE TABLE IF NOT EXISTS `stats` (
  `profit` bigint(20) unsigned NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `stats`
--

INSERT INTO `stats` (`profit`) VALUES
(0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `userID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userPass` varchar(200) NOT NULL,
  `userEmail` varchar(200) NOT NULL,
  `url` varchar(200) NOT NULL,
  `message` varchar(200) NOT NULL,
  `money` int(10) unsigned NOT NULL,
  PRIMARY KEY (`userID`),
  UNIQUE KEY `userEmail` (`userEmail`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=18 ;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userID`, `userPass`, `userEmail`, `url`, `message`, `money`) VALUES
(1, '78082cdf14a959be08ed58d887c0f1e4fc2e88ff', 'seg@sg.com', 'google.com', 'Hello!!', 0),
(2, '78082cdf14a959be08ed58d887c0f1e4fc2e88ff', 'test@test', 'google.com', 'GO awaayy', 0),
(14, '78082cdf14a959be08ed58d887c0f1e4fc2e88ff', 'test', 'http://craftyjs.com', 'CraftyJS - Greatest HTML5 Game Engine Ever!', 0),
(16, '518064e5f1406fba09187439824664a68d185332', 'louisstow@gmail.com', 'test', 'test', 0),
(17, '30d2fb74c594f09e65537dda596c229364827646', 'sgeseg', 'aegeg', 'awfawf', 0);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
