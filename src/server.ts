import "dotenv/config";
import express from "express";
import { Env, validateConfig } from "./env.js";
import { fetchLinkedInProfile } from "./fetcher.js";
import { parseLinkedInResponse } from "./parser.js";
import { validateLinkedInUrl } from "./validator.js";

validateConfig(Env)

const port = Number(Env.PORT);
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (_req, res) => {
  res.json({
    name: "LinkedIn Profile Scraper API",
    status: "healthy",
    endpoints: {
      profile: "/profile?url=https://www.linkedin.com/in/<username>",
    },
  });
});

// Profile fetching handler
const handleProfileRequest = async (req: express.Request, res: express.Response) => {
  const profileUrl =
    (req.query.profile_url as string) ||
    req.body?.profile_url;

  if (!profileUrl) {
    return res.status(400).json({
      success: false,
      message: "Missing LinkedIn profile URL. Provide via ?url=... query parameter or JSON body { profile_url: ... }",
    });
  }

  let { valid, message, username } = validateLinkedInUrl(profileUrl);
  if (!valid || !username) {
    return res.status(400).json({ success: false, message })
  }

  const { status, success, data } = await fetchLinkedInProfile(username);

  if (!success) {
    return res.status(status).json({
      success: false,
      message: "Failed to fetch profile from LinkedIn",
    });
  }

  if (!data) {
    return res.status(502).json({
      success: false,
      message: "LinkedIn returned an unsupported profile payload",
    });
  }

  const parsedProfile = parseLinkedInResponse(data);

  if (!parsedProfile) {
    return res.status(502).json({
      success: false,
      message: "LinkedIn returned an unsupported profile payload",
    });
  }

  return res.status(200).json({
    success: true,
    data: parsedProfile,
  });
};

app.get("/profile", handleProfileRequest);
app.post("/profile", handleProfileRequest);



app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});





