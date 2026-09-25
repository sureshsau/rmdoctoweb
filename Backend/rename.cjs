const fs = require('fs');
const path = require('path');

const dir = 'c:\\Dev\\RMDOCTO-APP\\rmdoctoweb\\Backend';

function walk(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walk(fullPath);
      }
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content
        .replace(/rmrider/g, 'delivery_partner')
        .replace(/RMRider/g, 'DeliveryPartner')
        .replace(/rmRider/g, 'deliveryPartner')
        .replace(/rm_rider/g, 'delivery_partner');
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walk(dir);
