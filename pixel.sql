-- phpMyAdmin SQL Dump
-- version 3.4.5
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jan 02, 2012 at 04:48 AM
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=22 ;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE IF NOT EXISTS `events` (
  `userID` int(10) unsigned NOT NULL,
  `eventDate` datetime NOT NULL,
  `event` varchar(200) NOT NULL,
  PRIMARY KEY (`userID`,`eventDate`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `pixels`
--

CREATE TABLE IF NOT EXISTS `pixels` (
  `pixelLocation` varchar(200) NOT NULL,
  `ownerID` int(11) NOT NULL,
  `cost` int(11) NOT NULL,
  `color` varchar(200) NOT NULL,
  `sold` int(10) unsigned NOT NULL,
  PRIMARY KEY (`pixelLocation`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=16 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
