// // import-abbas.js - 1000 RECORDS EVERY 3 MINUTES (1 MIN REST)
// import sql from "mssql";
// import fs from "fs";

// import dotenv from "dotenv";

// // Load environment variables from .env file
// dotenv.config();

// // Database config from environment variables
// const dbConfig = {
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   server: process.env.DB_SERVER,
//   database: process.env.DB_NAME,
//   encrypt: false,
//   trustServerCertificate: true,
//   connectTimeout: 300000,
//   requestTimeout: 300000
// }


// async function importAbbasData() {
//   try {
//     const rawData = fs.readFileSync("abbas.json", "utf8");
//     const events = JSON.parse(rawData);
//     console.log(`📁 Found ${events.length.toLocaleString()} events`);

//     await sql.connect(dbConfig);
//     console.log("✅ Connected");

//     // Get existing IDs
//     const existingResult = await sql.query`SELECT eventbriteID FROM event`;
//     const existingIDs = new Set(existingResult.recordset.map(row => String(row.eventbriteID)));
//     console.log(`📊 Existing: ${existingIDs.size.toLocaleString()}`);

//     // Filter new events
//     const newEvents = events.filter(event => !existingIDs.has(String(event.eventbriteID)));
//     console.log(`🆕 New: ${newEvents.length.toLocaleString()}`);
//     console.log(`⏭️ Skip: ${(events.length - newEvents.length).toLocaleString()}\n`);

//     if (newEvents.length === 0) {
//       console.log("No new events");
//       return;
//     }

//     const BATCH_SIZE = 1000;      // 1000 records
//     const WORK_SECONDS = 120;     // 2 minutes work (insert time)
//     const REST_SECONDS = 20;      // 1 minute rest
//     const CYCLE_SECONDS = WORK_SECONDS + REST_SECONDS; // 3 minutes total

//     const totalBatches = Math.ceil(newEvents.length / BATCH_SIZE);

//     console.log(`⚙️ SETTINGS:`);
//     console.log(`   📦 Batch: ${BATCH_SIZE.toLocaleString()} records`);
//     console.log(`   ⏰ Work: 2 minutes (insert)`);
//     console.log(`   😴 Rest: 1 minute`);
//     console.log(`   🔄 Total cycle: 3 minutes per batch`);
//     console.log(`   📊 Total batches: ${totalBatches.toLocaleString()}`);
//     console.log(`   ⏱️ Estimated time: ~${Math.ceil(totalBatches * 3 / 60)} hours\n`);

//     let inserted = 0;
//     let errors = 0;
//     const startTime = Date.now();

//     // Process 1000 records every 3 minutes (2 min work + 1 min rest)
//     for (let i = 0; i < newEvents.length; i += BATCH_SIZE) {
//       const batch = newEvents.slice(i, i + BATCH_SIZE);
//       const batchNum = Math.floor(i / BATCH_SIZE) + 1;
//       const batchStartTime = Date.now();

//       console.log(`\n${"=".repeat(50)}`);
//       console.log(`📦 BATCH ${batchNum.toLocaleString()}/${totalBatches.toLocaleString()}`);
//       console.log(`${"=".repeat(50)}`);
//       console.log(`💾 Inserting ${batch.length.toLocaleString()} records...`);

//       try {
//         // Build query for 1000 records
//         let query = `INSERT INTO event (
//           eventbriteID, event_title, city, state, zipcode,
//           contact_name, content, location, fee, status,
//           event_type, event_subType, numberOfseats, edate,
//           address, event_desc, url, country
//         ) VALUES `;

//         const values = [];

//         for (const event of batch) {
//           values.push(`(
//             '${String(event.eventbriteID).replace(/'/g, "''")}',
//             '${(event.event_title || '').replace(/'/g, "''").substring(0, 4000)}',
//             '${(event.city || '').replace(/'/g, "''").substring(0, 255)}',
//             '${(event.state || '').replace(/'/g, "''").substring(0, 255)}',
//             '${(event.zipcode || '').replace(/'/g, "''").substring(0, 20)}',
//             '${(event.contact_name || '').replace(/'/g, "''").substring(0, 255)}',
//             '${(event.content || '').replace(/'/g, "''").substring(0, 8000)}',
//             '${(event.location || '').replace(/'/g, "''").substring(0, 1000)}',
//             ${parseFloat(event.fee) || 0},
//             ${event.status === "1" ? 1 : 0},
//             '${(event.event_type || '').replace(/'/g, "''").substring(0, 255)}',
//             '${(event.event_subType || '').replace(/'/g, "''").substring(0, 255)}',
//             ${parseInt(event.numberOfseats) || 0},
//             ${event.edate ? `'${event.edate}'` : 'NULL'},
//             '${(event.address || '').replace(/'/g, "''").substring(0, 1000)}',
//             '${(event.event_desc || event.content || '').replace(/'/g, "''").substring(0, 8000)}',
//             '${(event.url || '').replace(/'/g, "''").substring(0, 1000)}',
//             '${(event.country || '').replace(/'/g, "''").substring(0, 255)}'
//           )`);
//         }

//         query += values.join(',');
//         await sql.query(query);
//         inserted += batch.length;

//         const workTime = ((Date.now() - batchStartTime) / 1000).toFixed(1);
//         const totalElapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
//         const percentComplete = ((inserted / newEvents.length) * 100).toFixed(1);

//         console.log(`✅ Inserted ${batch.length.toLocaleString()} records in ${workTime} seconds`);
//         console.log(`📊 Progress: ${inserted.toLocaleString()}/${newEvents.length.toLocaleString()} (${percentComplete}%)`);
//         console.log(`⏰ Total elapsed: ${totalElapsed} minutes`);

//         // Take 1 minute rest (except after last batch)
//         if (i + BATCH_SIZE < newEvents.length) {
//           console.log(`\n😴 Taking 1 minute rest...`);

//           // Countdown rest timer
//           for (let remaining = REST_SECONDS; remaining > 0; remaining--) {
//             process.stdout.write(`\r   ⏰ Rest ends in: ${remaining} seconds...`);
//             await new Promise(resolve => setTimeout(resolve, 1000));
//           }
//           console.log(`\r   🚀 Starting next batch...                    `);
//         }

//       } catch (err) {
//         console.log(`❌ BATCH ${batchNum} FAILED: ${err.message}`);
//         errors += batch.length;

//         // Take rest even after error
//         if (i + BATCH_SIZE < newEvents.length) {
//           console.log(`\n😴 Taking 1 minute rest before retry...`);
//           await new Promise(resolve => setTimeout(resolve, REST_SECONDS * 1000));
//         }
//       }
//     }

//     const totalMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
//     const avgSpeed = (inserted / totalMinutes).toFixed(0);

//     console.log("\n" + "=".repeat(60));
//     console.log("🎉🎉🎉 IMPORT COMPLETE 🎉🎉🎉");
//     console.log("=".repeat(60));
//     console.log(`✅ Inserted: ${inserted.toLocaleString()} records`);
//     console.log(`⏭️ Skipped: ${(events.length - newEvents.length).toLocaleString()}`);
//     console.log(`❌ Errors: ${errors.toLocaleString()}`);
//     console.log(`⏱️ Total time: ${totalMinutes} minutes (${(totalMinutes / 60).toFixed(1)} hours)`);
//     console.log(`⚡ Average speed: ${avgSpeed} records/minute`);
//     console.log(`📊 Final database total: ${(existingIDs.size + inserted).toLocaleString()}`);
//     console.log("=".repeat(60));

//     await sql.close();
//   } catch (err) {
//     console.error("💥 ERROR:", err.message);
//   }
// }

// importAbbasData();