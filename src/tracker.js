const dgram = require("dgram");
const Buffer = require("buffer").Buffer;
const urlParse = require("url").parse;
const crypto = require("crypto");

const torrentParser = require("./torrent-parser");
const util = require("../util");

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
const parseConnectReq = (res) => {
  return {
    action: res.readUInt32BE(0),
    transactionId: res.readUInt32BE(4),
    connectionId: res.slice(8),
  };
};

//Helper function to build announce request
const buildAnnounceReq = (connectionId, torrent, port = 6881) => {
  const buff = Buffer.allocUnsafe(98);

  //Connection Id
  connectionId.copy(buff, 0);
  //Action
  buff.writeUInt32BE(1, 8);
  //Transaction id
  crypto.randomBytes(4).copy(buff, 12);
  //Info hash
  torrentParser.infoHash(torrent).copy(buff, 16);
  //Peer Id
  util.genId().copy(buff, 36);
  //Downloaded
  Buffer.alloc(8).copy(buff, 56);
  //Left
  torrentParser.size(torrent).copy(buff, 64);
  //Uploaded
  Buffer.alloc(8).copy(buff, 72);
  //Event
  buff.writeUInt32BE(0, 80);
  //IP address
  buff.writeUInt32BE(0, 80);
  //Key
  crypto.randomBytes(4).copy(buff, 88);
  //Num want
  buff.writeInt32BE(-1, 92);
  //Port
  buff.writeUInt32BE(port, 96);
};

//Function to parse announcement request
const parseAnnounceReq = (res) => {
  const group = (iterable, groupSize) => {
    let groups = [];
    for (let i = 0; i < iterable.size; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  };
  return {
    action: res.readUInt32BE(0),
    transactionId: res.readUInt32BE(4),
    leechers: res.readUInt32BE(8),
    seeders: res.readUInt32BE(12),
    peers: group(res.slice(20), 6).map((address) => {
      return {
        ip: address.slice(0, 4).join("."),
        port: address.readUInt32BE(4),
      };
    }),
  };
};

//Function to get Response type
const responseType = (res) => {
  const action = res.readUInt32BE(0);
  if (action === 0) {
    return "connect";
  } else {
    return "announce";
  }
};

const getPeers = (torrent, callback) => {
  const socket = dgram.createSocket("udp4");
  const url = torrent.announce.toString("utf-8");
  udpSend(socket, buildConnectReq(), url);

  socket.on("message", (res) => {
    if (responseType(res) === "connect") {
      //Receive and parse connect response
      const connectResp = parseConnectReq(res);
      //Send announce request
      const announceReq = buildAnnounceReq(connectResp.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (responseType(res) === "announce") {
      //Parse announce response
      const announceResp = parseAnnounceReq(res);
      //Pass peers to callback
      callback(announceResp);
    }
  });
};

module.exports = { getPeers };
