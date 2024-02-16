const express = require("express");
const fs = require("fs");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Function to read data from the file-------
function readDataFromFile() {
  try {
    const data = fs.readFileSync("db.txt", "utf8");
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Error reading data from file:", err);
    return [];
  }
}

// Function to write data to the file----------
function writeDataToFile(data) {
  try {
    fs.writeFileSync("db.txt", JSON.stringify(data));
  } catch (err) {
    console.error("Error writing data to file:", err);
  }
}

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  socket.on("join_room", (data) => {
    socket.join(data);
  });

  socket.on("send_message", (data) => {
    // Store the message in memory------------
    const message = {
      room: data.room,
      username: data.username,
      message: data.message,
      timestamp: new Date().getTime()
    };
    // Read existing data from the file----------
    let chatMessages = readDataFromFile();
    // Add the new message--------
    chatMessages.push(message);
    // Write updated data back to the file-------
    writeDataToFile(chatMessages);

    // Emit the message to other clients in the room---------
    socket.to(data.room).emit("receive_message", message);
  });

  // Function to retrieve all chat messages in a room---------
  socket.on("get_all_messages", (room) => {
    const chatMessages = readDataFromFile();
    const messagesInRoom = chatMessages.filter(message => message.room === room);
    io.to(socket.id).emit("all_messages", messagesInRoom);
  });
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
