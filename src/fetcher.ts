import { Env } from "./env.js";

// export const extractUsername = (url: string): string => {
//   const cleaned = url.replace(/\/+$/, "");
//   const match = cleaned.match(/\/in\/([^/?#]+)/);
//   if (!match) {
//     throw new Error(`Invalid LinkedIn profile URL: ${url}`);
//   }
//   return match[1]!;
// };

export interface Result {
    status: number;
    success: boolean;
    data: any;
}

export const fetchLinkedInProfile = async (username: string): Promise<Result> => {
    let result: Result = {
        status: 500,
        success: false,
        data: null,
    };
    console.log(`[LinkedIn Scraper] Fetching profile for username: "${username}"...`);

    const apiUrl = `https://www.linkedin.com/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=${encodeURIComponent(
        username
    )}&decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-103`;

    const headers = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "application/vnd.linkedin.normalized+json+2.1",
        "Accept-Language": "en-US,en;q=0.9",
        "Cookie": `li_at=${Env.LIAT}; JSESSIONID=${Env.JSESSIONID};`,
        "csrf-token": Env.CSRF,
        "x-restli-protocol-version": "2.0.0",
        "x-li-lang": "en_US",
    };

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers,
            redirect: "manual",
        });

        let status = response.status;
        let success = false;
        let data: any = null;

        if (status >= 300 && status < 400) {
            const redirectLocation = response.headers.get("location");
            console.error(`[LinkedIn Scraper] Redirect detected (${status}). Location: ${redirectLocation}`);
            success = false;
            status = 500;
        } else if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            const message = `LinkedIn returned status ${status} ${response.statusText}`;
            console.error(message);
            console.error(`[LinkedIn Scraper] Error response from LinkedIn (${status}):`, errorText);
            success = false;
        } else {
            console.log(`[LinkedIn Scraper] Status: ${response.status} ${response.statusText}`);
            const rawText = await response.text();
            data = JSON.parse(rawText);
            success = true;
            console.log("[LinkedIn Scraper] Response received successfully!");
        }

        result = {
            status,
            success,
            data,
        };
    } catch (e: any) {
        console.error("[LinkedIn Scraper] Fetch Exception:", e);
        result = {
            status: 500,
            success: false,
            data: null,
        };
    }
    return result;
};

