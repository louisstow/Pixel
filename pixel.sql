-- phpMyAdmin SQL Dump
-- version 3.4.5
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Dec 28, 2011 at 09:32 PM
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
  `positive` enum('red','green','blue') NOT NULL,
  `neutral` enum('red','green','blue') NOT NULL,
  `negative` enum('red','green','blue') NOT NULL,
  `hint` enum('positive','neutral','negative') NOT NULL,
  `cycleTime` datetime NOT NULL,
  PRIMARY KEY (`cycleID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=15 ;

--
-- Dumping data for table `cycles`
--

INSERT INTO `cycles` (`cycleID`, `positive`, `neutral`, `negative`, `hint`, `cycleTime`) VALUES
(4, 'green', 'blue', 'red', 'negative', '2011-12-27 04:46:41'),
(5, 'blue', 'red', 'green', 'negative', '2011-12-27 04:46:44'),
(6, 'green', 'blue', 'red', 'negative', '2011-12-27 04:46:53'),
(7, 'green', 'red', 'blue', 'positive', '2011-12-27 04:46:59'),
(8, 'blue', 'green', 'red', 'negative', '2011-12-27 08:54:47'),
(9, 'red', 'blue', 'green', 'neutral', '2011-12-27 09:11:08'),
(10, 'blue', 'red', 'green', 'neutral', '2011-12-27 09:50:01'),
(11, 'green', 'red', 'blue', 'positive', '2011-12-27 19:51:24'),
(12, 'blue', 'red', 'green', 'negative', '2011-12-27 10:10:08'),
(13, 'blue', 'red', 'green', 'positive', '2011-12-28 05:15:49'),
(14, 'blue', 'green', 'red', 'negative', '2011-12-28 11:10:03');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE IF NOT EXISTS `events` (
  `userID` int(10) unsigned NOT NULL,
  `eventDate` int(10) unsigned NOT NULL,
  `event` varchar(200) NOT NULL,
  PRIMARY KEY (`userID`,`eventDate`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`userID`, `eventDate`, `event`) VALUES
(1, 2011, 'You won 1 and lost 1'),
(2, 2011, 'You won 1 and lost 1');

-- --------------------------------------------------------

--
-- Table structure for table `pixels`
--

CREATE TABLE IF NOT EXISTS `pixels` (
  `pixelLocation` varchar(200) NOT NULL,
  `ownerID` int(11) NOT NULL,
  `cost` int(11) NOT NULL,
  `color` varchar(200) NOT NULL,
  PRIMARY KEY (`pixelLocation`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `pixels`
--

INSERT INTO `pixels` (`pixelLocation`, `ownerID`, `cost`, `color`) VALUES
('514,138', 2, 0, '00ffff'),
('514,139', 1, 0, 'fa0aff'),
('514,140', 1, 0, 'fa0aff'),
('545,140', 2, 0, '00ffff');

-- --------------------------------------------------------

--
-- Table structure for table `transaction`
--

CREATE TABLE IF NOT EXISTS `transaction` (
  `transID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `buyerID` int(10) unsigned NOT NULL,
  `sellerID` int(10) unsigned NOT NULL,
  `pixelLocation` varchar(200) NOT NULL,
  `price` int(10) unsigned NOT NULL,
  PRIMARY KEY (`transID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `userID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userName` varchar(200) NOT NULL,
  `userPass` varchar(200) NOT NULL,
  `userEmail` varchar(200) NOT NULL,
  `url` varchar(200) NOT NULL,
  `message` varchar(200) NOT NULL,
  `money` int(10) unsigned NOT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userID`, `userName`, `userPass`, `userEmail`, `url`, `message`, `money`) VALUES
(1, 'Louis', '78082cdf14a959be08ed58d887c0f1e4fc2e88ff', 'seg@sg.com', 'google.com', 'Hello!!', 0),
(2, 'Notlouis', '78082cdf14a959be08ed58d887c0f1e4fc2e88ff', 'test@test', 'google.com', 'GO awaayy', 0);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
