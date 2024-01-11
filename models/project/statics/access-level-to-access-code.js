function accessLevelToAccessCode(level) {
  if (level === "private") {
    return 0;
  }
  if (level === "restricted") {
    return 1;
  }
  throw new Error(`Invalid access level ${level}`);
}

module.exports = accessLevelToAccessCode;
