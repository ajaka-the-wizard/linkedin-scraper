import { Env } from "./env.js";
import { logger } from "./logger.js";

export interface Result {
    status: number;
    success: boolean;
    data: any;
}

const MAX_LOG_STATUS_TEXT_LENGTH = 120;

const sanitizeStatusText = (statusText: string): string =>
    statusText
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_LOG_STATUS_TEXT_LENGTH) || "Unknown";

export const fetchLinkedInProfile = async (username: string): Promise<Result> => {
    let result: Result = {
        status: 500,
        success: false,
        data: null,
    };
    logger.info({ username }, `[LinkedIn Scraper] Fetching profile for username: "${username}"...`);

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
            logger.error(
                {
                    status,
                    statusText: sanitizeStatusText(response.statusText),
                    hasLocationHeader: response.headers.has("location"),
                },
                `[LinkedIn Scraper] Redirect detected (${status})`
            );
            success = false;
            status = 500;
        } else if (!response.ok) {
            const statusText = sanitizeStatusText(response.statusText);
            const message = `LinkedIn returned status ${status} ${statusText}`;
            logger.error(
                { status, statusText },
                `[LinkedIn Scraper] Error response from LinkedIn (${status}): ${message}`
            );
            success = false;
        } else {
            logger.info({ status, statusText: response.statusText }, `[LinkedIn Scraper] Status: ${response.status} ${response.statusText}`);
            const rawText = await response.text();
            data = JSON.parse(rawText);
            success = true;
            logger.info({ username }, "[LinkedIn Scraper] Response received successfully!");
        }

        result = {
            status,
            success,
            data,
        };
    } catch (e: any) {
        logger.error({ err: e }, "[LinkedIn Scraper] Fetch Exception");
        result = {
            status: 500,
            success: false,
            data: null,
        };
    }
    return result;
};
