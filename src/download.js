const net = require("net");
const Buffer = require("buffer").Buffer;
const { getPeers } = require("./tracker");
const message = require("./message");

const onWholeMessage = (socket, callback) => {
  const savedBuf = Buffer.alloc(0);
  let handshake = true;
  socket.on("data", (recvBuf) => {
    const msgLen = () =>
      handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readUInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);
    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.slice(0, msgLen()));
      savedBuf = savedBuf.slice(msgLen());
      handshake = false;
    }
  });
};

//Utility function to download files from peers
const download = (peer, torrent, requested) => {
  let queue = [];
  const socket = new net.Socket();
  socket.on("error", console.log);
  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandshake(torrent));
  });
  onWholeMessage(socket, (msg) => msgHandler(msg, socket, requested, queue));
};

const requestPiece = (socket, requested, queue) => {
  if (requested[queue[0]]) {
    queue.shift();
  } else {
    socket.write(message.buildRequest(pieceIndex));
  }
};

const haveHandler = (payload, socket, requested) => {
  const pieceIndex = payload.readUInt32BE(0);
  queue.push(pieceIndex);
  if (queue.length === 1) {
    socket.write(message.buildRequest(payload));
  }
};

const pieceHandler = (payload, socket, requested, queue) => {
  queue.shift();
  requestPiece(socket, requested, queue);
};

const msgHandler = (msg, socket, requested, queue) => {
  if (isHandshake(msg)) {
    socket.write(message.buildInterested());
  } else {
    const m = message.parse(msg);
    if (m.id === 0) chokeHandler();
    if (m.id === 1) unchokeHandler();
    if (m.id === 4) haveHandler(m.payload, socket, requested, queue);
    if (m.id === 5) bitfieldHandler(m.payload);
    if (m.id === 7) pieceHandler(m.payload, socket, requested, queue);
  }
};

const isHandshake = (msg) => {
  return (
    msg.length === msg.readUInt8(0) + 49 &&
    msg.toString("utf-8", 1) === "BitTorrent Protocol"
  );
};

const downloadFiles = (torrent) => {
  let requested = [];
  getPeers(torrent, (peers) => {
    peers.forEach(download(peer, torrent, requested));
  });
};

module.exports = { downloadFiles };
