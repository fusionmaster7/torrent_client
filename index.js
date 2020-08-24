const fs = require("fs");
const bencode = require("bencode");

const torrentBuffer = fs.readFileSync("./puppy.torrent");
const torrent = bencode.decode(torrentBuffer);

console.log(torrent.announce.toString("utf-8"));
