const dgram = require("dgram");
const Buffer = require("buffer").Buffer;
const urlParse = require("url").parse;

//Helper function to send a UDP connection request
const udpSend = (socket, message, rawUrl, callback = () => {}) => {
  const url = urlParse(rawUrl);
  socket.send(message, 0, message.length, url.port, url.host, callback);
};

const buildConnectReq = () => {
  /*.....*/
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
