module.exports = function () {
  // update view count and last accessed time
  this.viewsCount = (this.viewsCount || 0) + 1;
  this.accessedAt = new Date();
  return this;
};
