const fs = require("fs");
const bencode = require("bencode");

const { getPeers } = require("./src/tracker");
const { open } = require("./src/torrent-parser");
const download = require("./src/download");

const torrent = open(process.argv[2]);

getPeers(torrent, (peers) => {
  console.log(`Peers list: ${peers}`);
});
