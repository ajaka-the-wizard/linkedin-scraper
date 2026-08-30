import "dotenv/config";

const js: string = process.env["JSESSION_ID"]!;

export const Env = {
  LIAT: process.env["LI_AT"] || "",
  JSESSIONID: js,
  CSRF: js.replace(/^"|"$/g, ""),
  PORT: process.env["PORT"]
};
