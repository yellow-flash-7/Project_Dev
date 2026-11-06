import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Create your .env file from .env.example first.');
  process.exit(1);
}

const targetUrl = new URL(process.env.DATABASE_URL);
const databaseName = decodeURIComponent(targetUrl.pathname.replace(/^\//, ''));
if (!databaseName) {
  console.error('DATABASE_URL must include a database name after the port.');
  process.exit(1);
}

// Connect to PostgreSQL's default maintenance database to create the project DB.
targetUrl.pathname = '/postgres';
const client = new Client({ connectionString: targetUrl.toString() });

try {
  await client.connect();
  const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
  if (found.rowCount) {
    console.log(`Database "${databaseName}" already exists.`);
  } else {
    const safeName = databaseName.replace(/"/g, '""');
    await client.query(`CREATE DATABASE "${safeName}"`);
    console.log(`Database "${databaseName}" created successfully.`);
  }
} catch (error) {
  console.error('Could not create the database. Check your PostgreSQL service, username, password and permissions.');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
