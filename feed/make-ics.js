// Builds one calendar feed file per couple from Firestore, so phone calendars can subscribe to it.
const admin = require("firebase-admin");
const fs = require("fs");
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });

const BIG = ["Anniversary", "Birthday", "Trip"];
const z = n => String(n).padStart(2, "0");
const e2 = t => String(t).replace(/[\\;,]/g, "\\$&").replace(/\n/g, "\\n");
const al = (t, txt) => "BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:" + txt + "\r\nTRIGGER:" + t + "\r\nEND:VALARM\r\n";

function icsFor(list) {
  const ev = list.map(x => {
    const d = x[1].replace(/-/g, ""), big = BIG.includes(x[4]);
    // fixed DTSTAMP, so the file only changes when your events change (no needless redeploys)
    let o = "BEGIN:VEVENT\r\nUID:" + (x[1] + x[0]).replace(/[^a-z0-9]/gi, "") + "@couple-os\r\nDTSTAMP:20260101T000000Z\r\nSUMMARY:" + e2(x[0]) + "\r\n";
    if (x[3]) { const [h, m] = x[3].split(":"); o += "DTSTART:" + d + "T" + h + m + "00\r\nDURATION:PT1H\r\n"; }
    else o += "DTSTART;VALUE=DATE:" + d + "\r\n";
    if (x[2]) o += "RRULE:FREQ=" + (x[2] == 2 ? "YEARLY" : "MONTHLY") + "\r\n";
    o += al(x[3] ? "PT0S" : "PT8H", e2(x[0])) + al(x[3] ? "-P1D" : "-PT16H", "Tomorrow: " + e2(x[0]));
    if (big) o += al(x[3] ? "-P3D" : "-P2DT16H", "3 days left: " + e2(x[0]));
    return o + "END:VEVENT\r\n";
  }).join("");
  return "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Couple OS//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Couple OS\r\nREFRESH-INTERVAL;VALUE=DURATION:PT1H\r\nX-PUBLISHED-TTL:PT1H\r\n" + ev + "END:VCALENDAR\r\n";
}

(async () => {
  const snap = await admin.firestore().collection("couples").get();
  for (const doc of snap.docs) {
    let items = [];
    try { items = JSON.parse(doc.data().m_cal).items || []; } catch (e) { continue; }
    fs.writeFileSync(`cal-${doc.id}.ics`, icsFor(items));
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
