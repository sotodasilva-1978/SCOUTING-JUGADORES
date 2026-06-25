import http from 'http';
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const WebSocket = require('ws');

const wsUrl = await new Promise((resolve, reject) => {
  http.get('http://localhost:9222/json', (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const tabs = JSON.parse(d);
      resolve((tabs.find(t => t.type === 'page') || tabs[0]).webSocketDebuggerUrl);
    });
  }).on('error', reject);
});

const ws = new WebSocket(wsUrl);
let id = 1;
const send = (method, params={}) => new Promise(res => {
  const myId = id++;
  const handler = (msg) => {
    const data = JSON.parse(msg);
    if (data.id === myId) { ws.off('message', handler); res(data.result); }
  };
  ws.on('message', handler);
  ws.send(JSON.stringify({ id: myId, method, params }));
});

await new Promise(r => ws.on('open', r));
await send('Page.enable');
await send('Runtime.enable');

// Scroll the main scrollable container
await send('Runtime.evaluate', { expression: `
  const main = document.querySelector('main') || 
    document.querySelector('[class*=overflow]') ||
    Array.from(document.querySelectorAll('div')).find(d => d.scrollHeight > d.clientHeight + 100 && d.clientHeight > 400);
  if (main) { main.scrollTop = 800; main.tagName + ':' + main.className.substring(0,40); }
  else 'no scrollable found';
` });
await new Promise(r => setTimeout(r, 600));

const { data } = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/Usuario/AppData/Local/Temp/comparativas_duelo.png', Buffer.from(data, 'base64'));
console.log('done');
ws.close();
