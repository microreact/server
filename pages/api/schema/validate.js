import { ApiError } from "next/dist/server/api-utils";
import jsonschema from "jsonschema";

import schema from "../../../public/schema/v1";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "128mb",
    },
  },
};

export default async function (req, res) {
  if (!req.body || !req.body.schema) {
    throw new ApiError(400, "Invalid request");
  }

  const validator = new jsonschema.Validator();
  const result = validator.validate(
    req.body,
    schema,
  );

  res.json({
    valid: result.valid,
    errors: result.errors.map((x) => ({
      path: x.path,
      property: x.property,
      message: x.message,
      name: x.name,
      argument: x.argument,
    })),
  });
}
