module.exports = function (user) {
  if (user) {
    const userId = user.id;

    if (this.owner && this.owner.equals(userId)) {
      return true;
    }

    if (this.shares && this.shares.some((share) => share.user?.equals(userId))) {
      return true;
    }
  }

  return false;
};
