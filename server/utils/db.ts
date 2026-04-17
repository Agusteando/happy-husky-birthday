import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// Initialize core tables
pool.query(`
  CREATE TABLE IF NOT EXISTS overrides (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255),
    birthday DATE,
    high_rank BOOLEAN DEFAULT FALSE,
    event_id VARCHAR(255),
    baja BOOLEAN DEFAULT FALSE
  )
`).catch(console.error)

pool.query(`
  CREATE TABLE IF NOT EXISTS external_users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    plantel VARCHAR(100),
    birthday DATE,
    email VARCHAR(255),
    high_rank BOOLEAN DEFAULT FALSE,
    event_id VARCHAR(255),
    baja BOOLEAN DEFAULT FALSE,
    picture VARCHAR(255)
  )
`).catch(console.error)

// Initialize new Template Studio tables
pool.query(`
  CREATE TABLE IF NOT EXISTS templates (
    id VARCHAR(255) PRIMARY KEY COMMENT 'Linked directly to employee_id',
    name VARCHAR(255),
    image_url LONGTEXT,
    crop_meta TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(console.error)

pool.query(`
  CREATE TABLE IF NOT EXISTS birthday_messages (
    id VARCHAR(255) PRIMARY KEY,
    employee_id VARCHAR(255),
    author_name VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(console.error)

pool.query(`
  CREATE TABLE IF NOT EXISTS plantel_configs (
    plantel VARCHAR(100) PRIMARY KEY,
    recipient_emails TEXT
  )
`).catch(console.error)