const net = require("net");
const Buffer = require("buffer").Buffer;
const { getPeers } = require("./tracker");

//Utility function to download files from peers
const download = (peer) => {
  const socket = new net.Socket();
  socket.on("error", console.log);
  socket.connect(peer.port, peer.ip, () => {
    /*socket.write(....)*/
  });
  socket.on("data", (data) => {
    /*DATA RESPONSE HERE*/
  });
};

const downloadFiles = (torrent) => {
  getPeers(torrent, (peers) => {
    peers.forEach(download);
  });
};

module.exports = { downloadFiles };
