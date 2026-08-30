import "dotenv/config";

const js: string = process.env["JSESSION_ID"]!;

export const Env = {
  LIAT: process.env["LI_AT"] || "",
  JSESSIONID: js,
  CSRF: js.replace(/^"|"$/g, ""),
  PORT: process.env["PORT"]
};


export const validateConfig = (config: any): void => {
  const missingKeys: string[] = [];
  const walk = (node: any, prefix: string[] = []) => {
    const keys = Object.keys(node) as Array<keyof typeof node>;
    keys.forEach((key) => {
      const value = node[key];
      const fullKey = [...prefix, String(key)].join(".");
      if (value === undefined || value === null || value === "") {
        missingKeys.push(fullKey);
        return;
      }
      if (typeof value !== "string") {
        walk(value, [...prefix, String(key)]);
      }
    });
  };

  walk(config);

  if (missingKeys.length > 0) {
    missingKeys.forEach((key) => {
      console.error(`FATAL: Could not resolve Env variable for "${key}"`);
    });
    process.exit(1);
  }
};
export default validateConfig;