const fs = require("fs");
const bencode = require("bencode");

const { getPeers } = require("./tracker");

const torrentBuffer = fs.readFileSync("./puppy.torrent");
const torrent = bencode.decode(torrentBuffer);

getPeers(torrent, (peers) => {
  console.log(`Peers list: ${peers}`);
});
