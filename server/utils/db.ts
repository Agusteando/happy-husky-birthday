import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// Initialize tables
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