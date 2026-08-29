import http from 'node:http';

function attemptLogin(password) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ password });
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4321,
        path: '/api/admin/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          console.log(`Password: "${password}" -> Status: ${res.statusCode}, Body: ${body}`);
          resolve(res.statusCode);
        });
      }
    );
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing Admin Login:');
  await attemptLogin('wrongpassword');
  await attemptLogin('wokchords123');
  await attemptLogin('Dell@Hp');
}

run();
