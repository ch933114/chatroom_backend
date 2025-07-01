const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;

// 建立 HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(426);
    res.end('Upgrade Required');
  }
});

// 建立 WebSocket server，使用同一個 HTTP server
const wss = new WebSocket.Server({ server });

const rooms = {};

wss.on('connection', (ws) => {
  ws.room = null;

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    if (msg.type === 'join') {
      ws.room = msg.room;
      if (!rooms[ws.room]) {
        rooms[ws.room] = new Set();
      }
      rooms[ws.room].add(ws);
      console.log(`Client joined room: ${ws.room}`);
    }

    if (msg.type === 'message' && ws.room) {
      const roomClients = rooms[ws.room] || [];
      for (const client of roomClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              user: msg.user,
              text: msg.text || null,
              image: msg.image || null,
            })
          );
        }
      }
    }
  });

  ws.on('close', () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room].delete(ws);
    }
  });
});

// 啟動 HTTP server（同時包含 WebSocket）
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
