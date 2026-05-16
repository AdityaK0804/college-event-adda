// Temporary schema probe — run with: node schema-probe.mjs
// Delete after use.
import https from 'https';

const BASE = 'zwfutpwoqwniibnasqxs.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZnV0cHdvcXduaWlibmFzcXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzI5NjIsImV4cCI6MjA5NDUwODk2Mn0.Ds1h6ltmI8IqIRFIt1q7LCv5ecEiOHz0TXD2q5q7rfs';

async function probe(table, col) {
  return new Promise(resolve => {
    const opts = {
      hostname: BASE,
      path: `/rest/v1/${table}?select=${col}&limit=0`,
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    };
    https.get(opts, r => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => {
        if (r.statusCode === 200 || r.statusCode === 206) {
          resolve(`  ✅ ${table}.${col}`);
        } else {
          let msg = body;
          try { msg = JSON.parse(body).message; } catch {}
          resolve(`  ❌ ${table}.${col} => ${r.statusCode} ${msg}`);
        }
      });
    }).on('error', e => resolve(`  ⚠️  ${table}.${col} => ${e.message}`));
  });
}

const checks = [
  // profiles — declared in TypeScript
  ['profiles','id'], ['profiles','rrn'], ['profiles','name'], ['profiles','email'],
  ['profiles','department'], ['profiles','year'], ['profiles','phone'], ['profiles','bio'],
  ['profiles','role'], ['profiles','college'], ['profiles','created_at'], ['profiles','updated_at'],
  // profiles — possible alternatives to check
  ['profiles','full_name'], ['profiles','phone_number'], ['profiles','register_number'],
  ['profiles','avatar_url'], ['profiles','user_role'],
  // events — declared in TypeScript
  ['events','id'], ['events','title'], ['events','description'], ['events','date'],
  ['events','time'], ['events','location'], ['events','college'], ['events','category'],
  ['events','price'], ['events','image_url'], ['events','organizer_id'],
  ['events','organizer_name'], ['events','total_seats'], ['events','available_seats'],
  ['events','status'], ['events','featured'],
];

console.log('=== SUPABASE SCHEMA PROBE ===\n');
for (const [table, col] of checks) {
  console.log(await probe(table, col));
  await new Promise(r => setTimeout(r, 120));
}
console.log('\n=== DONE ===');
