const fs = require("fs");
const bencode = require("bencode");
const crypto = require("crypto");
const bignum = require("bignum");

const open = (filepath) => {
  return bencode.decode(fs.readFileSync(filepath));
};

const size = (torrent) => {
  const size = torrent.info.files
    ? torrent.info.files.map((file) => file.length).reduce((a, b) => a + b)
    : torrent.info.length;
  return bignum.toBuffer(size, { size: 8 });
};

const infoHash = (torrent) => {
  const info = bencode.encode(torrent.info);
  return crypto.createHash("sha1").update(info).digest();
};

module.exports = { open, size, infoHash };
