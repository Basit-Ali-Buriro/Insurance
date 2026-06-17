const path = require('path');
const fs = require('fs');

const activeDbPath = path.join(
  process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming'),
  'insurance-records-management-system',
  'appdata',
  'sysconfig.dat'
);

const targetPath = path.join(__dirname, 'sysconfig.dat');

console.log(`Checking active database file at: ${activeDbPath}`);

if (fs.existsSync(activeDbPath)) {
  try {
    fs.copyFileSync(activeDbPath, targetPath);
    console.log(`✅ Successfully copied active database to project root at: ${targetPath}`);
    console.log('This database configuration will now be pre-packaged inside your client setup installers.');
  } catch (err) {
    console.error(`❌ Failed to copy database file: ${err.message}`);
    process.exit(1);
  }
} else {
  console.log('⚠️ No active local database found in AppData to copy. Packaging will fallback to initial defaults.');
}
