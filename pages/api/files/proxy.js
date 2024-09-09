import { encode } from "next-auth/jwt";

import getUserMiddleware from "cgps-application-server/middleware/get-user.js";

import ProxyService from "../../../services/proxy-service.js";

import serverRuntimeConfig from "../../../utils/server-runtime-config.js";

export const config = {
  api: {
    externalResolver: true,
  },
};

async function userAuthorizationHeaders(user) {
  if (user && serverRuntimeConfig?.externalRequests?.secret) {
    const token = await encode({
      token: user,
      secret: serverRuntimeConfig.externalRequests.secret,
      maxAge: 60 * 60,
    });

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  return undefined;
}

export default async function (req, res) {
  const user = await getUserMiddleware(req, res);

  const authorizationHeaders = await userAuthorizationHeaders(user);

  const response = await ProxyService.getStream(
    req.query.url,
    {
      "Referer": req.headers.referer,
      ...(authorizationHeaders ?? {}),
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
