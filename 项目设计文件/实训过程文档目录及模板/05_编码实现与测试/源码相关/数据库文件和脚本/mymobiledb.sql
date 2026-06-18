# MySQL-Front 4.2  (Build 2.7)

/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE */;
/*!40101 SET SQL_MODE='STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES */;
/*!40103 SET SQL_NOTES='ON' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS */;
/*!40014 SET FOREIGN_KEY_CHECKS=0 */;


# Host: localhost    Database: mymobiledb
# ------------------------------------------------------
# Server version 5.0.22-community-nt

DROP DATABASE IF EXISTS `mymobiledb`;
CREATE DATABASE `mymobiledb` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `mymobiledb`;

#
# Table structure for table product
#

CREATE TABLE `product` (
  `id` int(11) NOT NULL auto_increment,
  `category` varchar(128) default NULL,
  `name` varchar(128) default NULL,
  `type` varchar(128) default NULL,
  `content` mediumtext,
  `summary` varchar(512) default NULL,
  `originalUrl` varchar(512) default NULL,
  `imageUrl` varchar(401) default NULL,
  `updatetime` datetime default NULL,
  `price` double NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

#
# Dumping data for table product
#
LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;

/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

#
# Table structure for table url_table
#

CREATE TABLE `url_table` (
  `id` int(11) NOT NULL auto_increment,
  `url` varchar(200) default NULL,
  `time` bigint(20) default NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `url` (`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

#
# Dumping data for table url_table
#
LOCK TABLES `url_table` WRITE;
/*!40000 ALTER TABLE `url_table` DISABLE KEYS */;

/*!40000 ALTER TABLE `url_table` ENABLE KEYS */;
UNLOCK TABLES;

/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
