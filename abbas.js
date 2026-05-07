// import-abbas.js - ONE BY ONE, NO DELAY (MAXIMUM SPEED)
import sql from "mssql";
import fs from "fs";

import dotenv from "dotenv";

// Load environment variables from .env file 
dotenv.config();

// Database config from environment variables
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  encrypt: false,
  trustServerCertificate: true,
  connectTimeout: 300000,
  requestTimeout: 300000
}  ///hdg
async function importAbbasData() {
  try {
    const rawData = fs.readFileSync("abbas.json", "utf8");
    const events = JSON.parse(rawData);
    console.log(`📁 Found ${events.length.toLocaleString()} events`);

    await sql.connect(dbConfig);
    console.log("✅ Connected");

    // Get existing IDs
    const existingResult = await sql.query`SELECT eventbriteID FROM event`;
    const existingIDs = new Set(existingResult.recordset.map(row => String(row.eventbriteID)));
    console.log(`📊 Existing: ${existingIDs.size.toLocaleString()}`);

    // Filter new events
    const newEvents = events.filter(event => !existingIDs.has(String(event.eventbriteID)));
    console.log(`🆕 New: ${newEvents.length.toLocaleString()}`);
    console.log(`⏭️ Skip: ${(events.length - newEvents.length).toLocaleString()}\n`);

    if (newEvents.length === 0) {
      console.log("No new events");
      return;
    }

    console.log(`⚡ Inserting ONE BY ONE with NO DELAY...\n`);

    let inserted = 0;
    let errors = 0;
    const startTime = Date.now();

    // Insert one by one - NO WAITING
    for (const event of newEvents) {
      const eventId = String(event.eventbriteID);

      try {
        await sql.query`
          INSERT INTO event (
            eventbriteID, event_title, city, state, zipcode,
            contact_name, content, location, fee, status,
            event_type, event_subType, numberOfseats, edate
          ) VALUES (
            ${eventId},
            ${event.event_title || ''},
            ${event.city || ''},
            ${event.state || ''},
            ${event.zipcode || ''},
            ${event.contact_name || ''},
            ${event.content || ''},
            ${event.location || ''},
            ${parseFloat(event.fee) || 0},
            ${event.status === "1" ? 1 : 0},
            ${event.event_type || ''},
            ${event.event_subType || ''},
            ${parseInt(event.numberOfseats) || 0},
            ${event.edate || null}
          )
        `;

        inserted++;

        // Show progress every 1000 records
        if (inserted % 1000 === 0) {
          const elapsedMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
          const percent = ((inserted / newEvents.length) * 100).toFixed(1);
          console.log(`📊 ${inserted.toLocaleString()}/${newEvents.length.toLocaleString()} (${percent}%) | ${elapsedMin} min`);
        }

      } catch (err) {
        errors++;
        console.log(`❌ ${eventId}: ${err.message}`);
      }
    }

    const totalMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log("\n========== DONE ==========");
    console.log(`✅ Inserted: ${inserted.toLocaleString()}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`⏱️ Time: ${totalMin} minutes (${(totalMin / 60).toFixed(1)} hours)`);

    await sql.close();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

importAbbasData();