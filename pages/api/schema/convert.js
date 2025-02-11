import { ApiError } from "next/dist/server/api-utils";
import createMicroreactDocument from "microreact.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "128mb",
    },
  },
};

export default async function (req, res) {
  if (!req.body) {
    throw new ApiError(400, "Invalid request");
  }

  if (req.body.schema) {
    const { schema } = require("microreact-viewer");
    res.json(
      schema(req.body)
    );
  }
  else {
    const json = await createMicroreactDocument(req.body);
    res.json(json);
  }
}
