const net = require("net");
const Buffer = require("buffer").Buffer;
const { getPeers } = require("./tracker");

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
const download = (peer) => {
  const socket = new net.Socket();
  socket.on("error", console.log);
  socket.connect(peer.port, peer.ip, () => {
    /*socket.write(....)*/
  });
  onWholeMessage(socket, (data) => {
    /*RESPONSE HERE*/
  });
};

const downloadFiles = (torrent) => {
  getPeers(torrent, (peers) => {
    peers.forEach(download);
  });
};

module.exports = { downloadFiles };
