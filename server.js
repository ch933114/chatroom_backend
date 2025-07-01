const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: PORT });

// 記錄房間：{ roomName: Set of clients }
const rooms = {};

wss.on("connection", (ws) => {
  ws.room = null;

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    if (msg.type === "join") {
      ws.room = msg.room;
      if (!rooms[ws.room]) {
        rooms[ws.room] = new Set();
      }
      rooms[ws.room].add(ws);
      console.log(`Client joined room: ${ws.room}`);
    }

    if (msg.type === "message" && ws.room) {
      const roomClients = rooms[ws.room] || [];
      for (const client of roomClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              user: msg.user,
              text: msg.text || null,
              image: msg.image || null, // 新增 image 欄位
            })
          );
        }
      }
    }
  });

  ws.on("close", () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room].delete(ws);
    }
  });
});
