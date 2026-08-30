# LinkedIn Profile API

An Express and TypeScript API that accepts a public LinkedIn profile URL and returns the profile data available through an authenticated LinkedIn session as structured JSON.

This project was built for the LinkedIn Profile API hiring challenge. Before submitting or using it in production, deploy it behind HTTPS and ensure your use complies with LinkedIn's terms and all applicable laws.

## What it returns

When the information is available in LinkedIn's response, the API returns:

- Name, headline, public identifier, and about section
- Location and profile/background image URLs
- Experience and education
- Skills, certifications, languages, and projects
- Volunteer experience, honors, and publications

## Requirements

- Node.js 18 or later
- npm
- A LinkedIn session for the backend, provided as environment variables

## Setup

Clone the repository, install dependencies, then create a local environment file:

```bash
npm install
cp .env.example .env
```

Set the required values in `.env`:

```env
PORT=3000
LI_AT="your_li_at_cookie_value"
JSESSION_ID=""ajax:your_jsessionid_value""
ENV=development
```

`JSESSION_ID` intentionally uses two pairs of quotes. The outer pair is removed by dotenv while the inner pair is retained for LinkedIn's `JSESSIONID` cookie format.

Never commit `.env` or deploy these values to the client. The repository's `.gitignore` excludes `.env`; use your hosting provider's secret manager or environment-variable settings in production.

## Run locally

Start the development server with file watching:

```bash
npm run dev
```

Build and start the production version:

```bash
npm run build
npm start
```

The server listens on `http://localhost:3000` by default.

## API

### Health check

`GET /`

```json
{
  "name": "LinkedIn Profile Scraper API",
  "status": "healthy",
  "endpoints": {
    "profile": "/profile?profile_url=https://www.linkedin.com/in/<username>"
  }
}
```

### Fetch a profile

`GET /profile` or `POST /profile`

Provide the full HTTPS LinkedIn profile URL using the `profile_url` parameter. Only URLs shaped like `https://www.linkedin.com/in/<username>` are accepted.

```bash
curl "http://localhost:3000/profile?profile_url=https://www.linkedin.com/in/jane-doe"
```

```bash
curl -X POST "http://localhost:3000/profile" \
  -H "Content-Type: application/json" \
  -d '{"profile_url":"https://www.linkedin.com/in/jane-doe"}'
```

A successful request returns `200 OK`:

```json
{
  "success": true,
  "data": {
    "publicIdentifier": "jane-doe",
    "entityUrn": "urn:li:fsd_profile:synthetic-profile",
    "firstName": "Jane",
    "lastName": "Doe",
    "fullName": "Jane Doe",
    "headline": "Software Engineer",
    "about": "A synthetic profile summary used only for parser development.",
    "location": { "countryCode": "US", "name": "Example City" },
    "profilePicture": null,
    "backgroundPicture": null,
    "experiences": [
      {
        "title": "Software Engineer",
        "companyName": "Example Company",
        "companyUrn": "urn:li:fsd_company:synthetic-company",
        "companyUrl": "https://www.linkedin.com/company/example-company/",
        "companyLogo": null,
        "locationName": "Example City, United States",
        "dateRange": {
          "start": { "month": 6, "year": 2024, "day": null, "formatted": "June 2024" },
          "end": null,
          "isCurrent": true
        },
        "description": "Built and maintained backend services for an example product."
      }
    ],
    "educations": [
      {
        "schoolName": "Example University",
        "schoolUrn": "urn:li:fsd_company:synthetic-school",
        "degreeName": "Bachelor of Science",
        "fieldOfStudy": "Computer Science",
        "grade": null,
        "activities": null,
        "description": "A synthetic education record used only for parser development.",
        "dateRange": {
          "start": { "month": 9, "year": 2018, "day": null, "formatted": "September 2018" },
          "end": { "month": 6, "year": 2022, "day": null, "formatted": "June 2022" },
          "isCurrent": false
        }
      }
    ],
    "skills": ["TypeScript", "Distributed Systems"],
    "certifications": [],
    "languages": [],
    "projects": [
      {
        "title": "Example Task Scheduler",
        "description": "A synthetic project record used only for parser development.",
        "url": "https://example.test/projects/task-scheduler",
        "dateRange": {
          "start": { "month": 11, "year": 2023, "day": null, "formatted": "November 2023" },
          "end": { "month": 2, "year": 2024, "day": null, "formatted": "February 2024" },
          "isCurrent": false
        }
      }
    ],
    "volunteerExperiences": [],
    "honors": [],
    "publications": []
  }
}
```

`profilePicture` is either `null` or an object with `displayUrl` and `raw` properties. `backgroundPicture` is either `null` or an object with `displayUrl`. Empty arrays indicate that LinkedIn did not return data for that section.

Invalid input returns `400`. Upstream HTTP statuses are returned as-is. Redirects and fetch exceptions return `500`. Unsupported profile payloads return `502`.

## Approach

The service extracts the public identifier from the supplied URL, then makes an authenticated server-side request to LinkedIn's Voyager endpoint. LinkedIn returns a normalized graph: the parser indexes the `included` entities by URN and resolves related profile, company, geographical, and image data into one response object. Image URLs use the largest available vector-image artifact.

Requests are protected with Helmet, assigned a request ID, and written to structured logs. Redirects are handled manually so authentication walls and checkpoints do not get followed as successful profile responses.

## Known limitations

- LinkedIn's internal endpoints and response shapes are not public, stable APIs and may change without notice.
- Results depend on the authenticated account, the target profile's visibility, and the data LinkedIn returns; normalized fields use `null`, empty strings, or empty arrays when data is unavailable.
- Sessions can expire or trigger authentication, checkpoint, rate-limit, or redirect responses. This API reports those failures but does not renew sessions or bypass access controls.
