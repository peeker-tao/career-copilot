const https = require('https');
const fs = require('fs');
const path = require('path');

const filePath = 'D:\\gitclone\\软件工程实训（二）\\career-copilot\\backend\\uploads\\audio\\1314a08c-0b2a-4920-92a4-b4515ef33d94.wav';
const fileBuffer = fs.readFileSync(filePath);
const boundary = '----' + Date.now();

// Build multipart body manually with Buffer
const crlf = '\r\n';
const headerParts = [
  '--' + boundary,
  'Content-Disposition: form-data; name="model"',
  '',
  'Paraformer',
  '--' + boundary,
  'Content-Disposition: form-data; name="file"; filename="test.wav"',
  'Content-Type: audio/wav',
  '',
];
const footerParts = [
  '',
  '--' + boundary + '--',
];

const headerBuf = Buffer.from(headerParts.join(crlf) + crlf, 'utf8');
const footerBuf = Buffer.from(crlf + footerParts.join(crlf), 'utf8');
const body = Buffer.concat([headerBuf, fileBuffer, footerBuf]);

console.log('File size:', fileBuffer.length);
console.log('Body size:', body.length);

const options = {
  hostname: 'dashscope.aliyuncs.com',
  path: '/compatible-mode/v1/audio/transcriptions',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + process.env.DASHSCOPE_API_KEY,
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': body.length,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('StatusMessage:', res.statusMessage);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('Body:', data.slice(0, 1000));
  });
});
req.on('error', (e) => console.log('Error:', e.message));
req.write(body);
req.end();
