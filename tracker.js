const dgram = require("dgram");
const Buffer = require("buffer").Buffer;
const urlParse = require("url").parse;
const crypto = require("crypto");

//Helper function to send a UDP connection request
const udpSend = (socket, message, rawUrl, callback = () => {}) => {
  const url = urlParse(rawUrl);
  socket.send(message, 0, message.length, url.port, url.host, callback);
};

//Helper function to build a connection request
const buildConnectReq = () => {
  const buff = Buffer.alloc(16);

  //Writing Connection ID
  buff.writeUInt32BE(0x417, 0);
  buff.writeUInt32BE(0x27101980, 4);

  //Writing action
  buff.writeUInt32BE(0, 8);

  //Writing Transaction ID
  crypto.randomBytes(4).copy(buff, 12);

  return buff;
};

//Helper function to parse a connection request
const parseConnectResp = (res) => {
  return {
    action: res.readUInt32BE(0),
    transactionId: res.readUInt32BE(4),
    connectionId: res.slice(8),
  };
};

const getPeers = (torrent, callback) => {
  const socket = dgram.createSocket("udp4");
  const url = torrent.announce.toString("utf-8");
  udpSend(socket, buildConnectReq(), url);

  socket.on("message", (res) => {
    if (responseType(res) === "connect") {
      //Receive and parse connect response
      const connectResp = parseConnectResp(res);
      //Send announce request
      const announceReq = buildAnnounceReq(connectResp.connectionId);
      udpSend(socket, announceReq, url);
    } else if (responseType(res) === "announce") {
      //Parse announce response
      const announceResp = parseAnnounceResp(res);
      //Pass peers to callback
      callback(announceResp);
    }
  });
};

module.exports = { getPeers };
