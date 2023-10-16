import ProxyService from "../../../services/proxy-service";

export const config = {
  api: {
    externalResolver: true,
  },
};

export default async function (req, res) {
  const response = await ProxyService.getStream(
    req.query.url,
    {
      "Referer": req.headers.referer,
    },
  );

  res.status(response.status ?? 200);

  if (response.headers) {
    for (const [ key, value ] of Object.entries(response.headers)) {
      res.setHeader(key, value);
    }
  }

  response.stream.pipe(res);
}
