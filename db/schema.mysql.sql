-- Daily News Digest (MVP) - MySQL 스키마
-- 실행 예) mysql -u root -p < db/schema.mysql.sql

CREATE DATABASE IF NOT EXISTS daily_news_digest
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE daily_news_digest;

-- 구독자
CREATE TABLE IF NOT EXISTS subscribers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_email (email)
) ENGINE=InnoDB;

-- 구독 언어 (ko/en)
CREATE TABLE IF NOT EXISTS subscriber_languages (
  subscriber_id BIGINT UNSIGNED NOT NULL,
  lang VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscriber_id, lang),
  CONSTRAINT fk_subscriber_languages_subscriber
    FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 구독 키워드
CREATE TABLE IF NOT EXISTS subscriber_keywords (
  subscriber_id BIGINT UNSIGNED NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscriber_id, keyword),
  CONSTRAINT fk_subscriber_keywords_subscriber
    FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 콘솔 로그 저장용 테이블
CREATE TABLE IF NOT EXISTS app_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source VARCHAR(32) NOT NULL DEFAULT 'server',
  level VARCHAR(16) NOT NULL,
  message LONGTEXT NOT NULL,
  meta JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_created_at (created_at),
  KEY idx_source_level (source, level)
) ENGINE=InnoDB;
