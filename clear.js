const fs = require('fs');

try {
  fs.rmSync('dist', { recursive: true });
} catch (err) {
  console.warn(err);
}

