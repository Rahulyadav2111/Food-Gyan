const neo4j = require('neo4j-driver');
require('dotenv').config();

const URI = process.env.NEO_URI
const USER = process.env.NEO_USER
const PASSWORD = process.env.NEO_PASSWORD

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));


(async () => {
  let session;
  try {
    session = driver.session();
    const serverInfo = await session.run('RETURN 1');
    console.log('Connection established to Neo4j Aura');
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    if (session) await session.close();
  }
})();

module.exports = driver;