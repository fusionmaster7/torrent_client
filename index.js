const fs = require("fs");
const bencode = require("bencode");

const { getPeers } = require("./tracker");
const { open } = require("./torrent-parser");

const torrent = open("./puppy.torrent");

getPeers(torrent, (peers) => {
  console.log(`Peers list: ${peers}`);
});
