const Slugs = require("cgps-application-server/utils/slugs");

const UrlService = require("../../../services/url-service");

module.exports = function teamUrl(id, title) {
  const path = (
    (title && id.length === 22)
      ?
      Slugs.fromId(id, title)
      :
      id
  );
  return UrlService.absolute(`team/${path}`);
};
