function accessCodeToAccessLevel(code) {
  if (code === 0) {
    return "private";
  }
  if (code === 1) {
    return "restricted";
  }
  throw new Error(`Invalid access code ${code}`);
}

module.exports = accessCodeToAccessLevel;
