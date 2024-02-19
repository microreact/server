module.exports = function hasOnwerAccess(user) {
  return user && user.id && this?.owner?.equals(user.id);
};
