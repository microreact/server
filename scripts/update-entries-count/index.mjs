import "cgps-stdlib/config/load-env.js";
import setConfig from "cgps-stdlib/config/set-config.js";

import config from "../../config.json" assert { type: "json" };

setConfig(config);

async function main() {
  const { default: updateEntriesCount } = await import("./main.mjs");
  await updateEntriesCount();
}

main()
  .then(() => {
    console.info("Done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
