import http from 'node:http';

http.get('http://localhost:4321/admin/', (res) => {
  let text = '';
  res.on('data', (c) => (text += c));
  res.on('end', () => {
    console.log('Admin page contains "Dell@Hp":', text.includes('Dell@Hp'));
    console.log('Admin page contains "wokchords123":', text.includes('wokchords123'));
    console.log('Admin page contains "default password":', text.toLowerCase().includes('default password'));
    const idx = text.indexOf('Admin login');
    if (idx !== -1) {
      console.log('\nAdmin Login Form snippet:');
      console.log(text.slice(idx, idx + 250));
    }
  });
});
