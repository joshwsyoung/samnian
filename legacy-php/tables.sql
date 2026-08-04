
CREATE TABLE availability (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11),
  event_date DATE,
  slot ENUM('12:00','13:00','14:00','18:00','19:00','20:00'),
  PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE chat_messages (
  id INT(11) NOT NULL AUTO_INCREMENT,
  conversation_id INT(11),
  sender_id INT(11),
  message TEXT,
  sent_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY conversation_id (conversation_id),
  KEY sender_id (sender_id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE conversations (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE conversation_users (
  conversation_id INT(11) NOT NULL,
  user_id INT(11) NOT NULL,
  status ENUM('pending','accepted','declined') DEFAULT 'pending',
  PRIMARY KEY (conversation_id, user_id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE interests (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(100),
  PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE matches (
  id INT(11) NOT NULL AUTO_INCREMENT,
  event_date DATE,
  slot ENUM('12:00','13:00','14:00','18:00','19:00','20:00'),
  price_point ENUM('£','££','£££'),
  approved TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE match_users (
  match_id INT(11),
  user_id INT(11)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE personality_scores (
  user_id INT(11) NOT NULL,
  openness FLOAT,
  conscientiousness FLOAT,
  extraversion FLOAT,
  agreeableness FLOAT,
  neuroticism FLOAT,
  PRIMARY KEY (user_id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE personality_tests (
  id INT(11) NOT NULL AUTO_INCREMENT,
  question TEXT NOT NULL,
  answer_type ENUM('single','multiple') DEFAULT 'single',
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  reverse TINYINT(1) DEFAULT 0,
  required TINYINT(1) DEFAULT 1,
  options LONGTEXT,
  trait VARCHAR(1),
  PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  age INT(11),
  city VARCHAR(100),
  password_hash VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  price_point ENUM('£','££','£££'),
  PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE user_interests (
  user_id INT(11),
  interest_id INT(11)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
