const fs = require("fs");
const bencode = require("bencode");

const { getPeers } = require("./src/tracker");
const { open } = require("./src/torrent-parser");
const { downloadFiles } = require("./src/download");

const torrent = open(process.argv[2]);

downloadFiles(torrent, torrent.info.name);
