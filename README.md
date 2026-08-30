# LinkedIn Profile Scraper API

A high-performance, reverse-engineered LinkedIn Profile Extraction API built with Node.js, Express, and TypeScript. It accepts a LinkedIn public profile URL and returns structured, normalized JSON containing full profile data (name, headline, about, experience, education, skills, certifications, projects, languages, and media).

---

## Features

- **Direct Voyager/Restli Integration**: Reverse-engineers LinkedIn's internal GraphQL/Restli graph API for low latency and high data fidelity.
- **Normalized Schema Extraction**: Automatically resolves entity references in LinkedIn's normalized response (`included` graph) into a clean, intuitive JSON structure.
- **Strict Input Validation**: Validates URL structure, HTTPS protocol, domain legitimacy, and sanitized username identifiers.
- **Robust Error Handling & Redirect Protection**: Uses manual redirect handling to intercept authwall and checkpoint challenges without infinite loops.
- **Zero Third-Party Scraping SaaS Dependencies**: No dependence on paid scrapers (Proxycurl, RapidAPI, etc.); uses direct authenticated session headers.

---

## Response Schema Overview

The API extracts and normalizes the following profile details:

- **Basic Info**: `firstName`, `lastName`, `fullName`, `headline`, `about` (summary), `publicIdentifier`, `entityUrn`
- **Location**: `countryCode`, resolved geographical name (e.g. `"Nigeria"`, `"United States"`)
- **Media**: Profile picture and background image URLs resolved from highest-resolution vector image artifacts
- **Experience**: Titles, company names, company URLs, company logos, locations, date ranges, and descriptions
- **Education**: School names, degrees, fields of study, descriptions, and date ranges
- **Skills**: Comprehensive list of all added and endorsed skills
- **Projects**: Project names, descriptions, URLs, and timelines
- **Certifications & Languages**: Names, authorities, proficiency levels, and dates
- **Volunteer & Honors**: Roles, causes, issuers, and descriptions

---

## Technical Approach & Architecture

### 1. Reverse-Engineering LinkedIn Voyager
LinkedIn's web client communicates with internal Restli/Voyager endpoints using session cookies (`li_at` and `JSESSIONID`). By providing these credentials in server-side requests alongside matching `csrf-token` headers and browser headers (`User-Agent`, `x-restli-protocol-version: 2.0.0`), the server queries LinkedIn's internal decorator endpoints:

```
GET https://www.linkedin.com/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity={username}&decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-103
```

### 2. Graph Resolution & Normalization
LinkedIn's API returns data in a normalized relational format:
- `data`: Contains root collection metadata and entity pointers (URNs).
- `included`: A flat array of typed objects (`$type`), including `Profile`, `Position`, `Education`, `Skill`, `Geo`, `Company`, etc.

The parser (`src/parser.ts`) constructs an in-memory URN lookup map, walks the entity references, and links related objects (e.g., matching a position's `companyUrn` to the company's vector logo and website URL).

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or pnpm
- A valid LinkedIn account session (`li_at` and `JSESSIONID`)

### 1. Clone the Repository
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <REPOSITORY_NAME>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your LinkedIn session credentials:
```env
PORT=3000
LI_AT="AQED..."
JSESSION_ID=""ajax:1234567890123456789""
```

> [!IMPORTANT]
> **Why `JSESSION_ID` uses double sets of quotes (`""...""`):**  
> LinkedIn's server strictly requires `JSESSIONID` inside the HTTP `Cookie` header to be wrapped in literal double quotes (i.e. `JSESSIONID="ajax:...";`).  
> Because `dotenv` automatically strips the outermost set of quotes when loading `.env` files into `process.env`, adding a double set of quotes (e.g., `JSESSION_ID=""ajax:...""`) ensures that the inner literal double quotes are preserved when constructing the `Cookie` header for LinkedIn API calls.

> **How to get your session cookies:**
> 1. Log in to [linkedin.com](https://www.linkedin.com) in your browser.
> 2. Open Developer Tools (`F12`) > **Application** > **Storage** > **Cookies** > `https://www.linkedin.com`.
> 3. Copy the values for `li_at` and `JSESSIONID`.

---

## Running the Application

### Development Mode (with hot reloading)
```bash
npm run dev
```

### Production Build & Start
```bash
npm run build
npm start
```

---

## API Documentation

### 1. Health Check
`GET /`

**Response:**
```json
{
  "name": "LinkedIn Profile Scraper API",
  "status": "healthy",
  "endpoints": {
    "profile": "/profile?profile_url=https://www.linkedin.com/in/<username>"
  }
}
```

---

### 2. Fetch Profile
`GET /profile` or `POST /profile`

#### Parameters

| Parameter | Type | In | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `profile_url`| `string` | Query / Body | **Yes** | Full HTTPS LinkedIn profile URL |


#### Example Request
```bash
curl -X GET "http://localhost:3000/profile?profile_url=https://www.linkedin.com/in/jane-doe"
```

Or via JSON body:
```bash
curl -X POST "http://localhost:3000/profile" \
     -H "Content-Type: application/json" \
     -d '{"profile_url": "https://www.linkedin.com/in/jane-doe"}'
```

#### Example Response (200 OK)

> **Note:** The response below contains generic placeholder data for illustration, but reflects the exact schema structure, keys, and data types produced by the API parser.

```json
{
  "success": true,
  "data": {
    "publicIdentifier": "jane-doe",
    "entityUrn": "urn:li:fsd_profile:ACoAAD00000EXAMPLE",
    "firstName": "Jane",
    "lastName": "Doe",
    "fullName": "Jane Doe",
    "headline": "Senior Staff Software Engineer | Distributed Systems & Cloud Architecture | Go, Rust, TypeScript",
    "about": "Passionate software engineer with 8+ years of experience designing scalable backend architectures, real-time data pipelines, and developer infrastructure...",
    "location": {
      "countryCode": "US",
      "name": "San Francisco Bay Area"
    },
    "profilePicture": {
      "displayUrl": "https://media.licdn.com/dms/image/v2/EXAMPLE_PROFILE_PICTURE_URL.jpg"
    },
    "backgroundPicture": {
      "displayUrl": "https://media.licdn.com/dms/image/v2/EXAMPLE_BACKGROUND_PICTURE_URL.jpg"
    },
    "experiences": [
      {
        "title": "Senior Staff Engineer",
        "companyName": "Acme Technologies",
        "companyUrn": "urn:li:fsd_company:123456",
        "companyUrl": "https://www.linkedin.com/company/acme-technologies/",
        "companyLogo": "https://media.licdn.com/dms/image/v2/EXAMPLE_COMPANY_LOGO.jpg",
        "locationName": "San Francisco, CA",
        "dateRange": {
          "start": {
            "month": 3,
            "year": 2022,
            "day": null,
            "formatted": "March 2022"
          },
          "end": null,
          "isCurrent": true
        },
        "description": "Leading architecture for high-throughput distributed processing engines and storage layers."
      }
    ],
    "educations": [
      {
        "schoolName": "University of Technology",
        "schoolUrn": "urn:li:fsd_company:654321",
        "degreeName": "Bachelor of Science",
        "fieldOfStudy": "Computer Science",
        "grade": "First Class Honours",
        "activities": null,
        "description": "Coursework focused on distributed computing, algorithms, and operating systems.",
        "dateRange": {
          "start": {
            "month": 9,
            "year": 2014,
            "day": null,
            "formatted": "September 2014"
          },
          "end": {
            "month": 6,
            "year": 2018,
            "day": null,
            "formatted": "June 2018"
          },
          "isCurrent": false
        }
      }
    ],
    "skills": [
      "Distributed Systems",
      "Cloud Infrastructure",
      "Go (Programming Language)",
      "Rust",
      "TypeScript",
      "PostgreSQL",
      "Docker",
      "Kubernetes"
    ],
    "certifications": [
      {
        "name": "AWS Certified Solutions Architect – Professional",
        "authority": "Amazon Web Services (AWS)",
        "url": "https://www.credly.com/org/amazon-web-services/badge/aws-certified-solutions-architect-professional",
        "licenseNumber": "AWS-PSA-12345",
        "dateRange": {
          "start": {
            "month": 1,
            "year": 2023,
            "day": null,
            "formatted": "January 2023"
          },
          "end": null,
          "isCurrent": true
        }
      }
    ],
    "languages": [
      {
        "name": "English",
        "proficiency": "NATIVE_OR_BILINGUAL"
      }
    ],
    "projects": [
      {
        "title": "Distributed Task Scheduler",
        "description": "An open-source, resilient job scheduler built in Go supporting cron expressions and distributed worker pools.",
        "url": "https://github.com/example/task-scheduler",
        "dateRange": {
          "start": {
            "month": 5,
            "year": 2023,
            "day": null,
            "formatted": "May 2023"
          },
          "end": {
            "month": 10,
            "year": 2023,
            "day": null,
            "formatted": "October 2023"
          },
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

---

## Known Limitations & Edge Cases

1. **Session Lifespan & Rotation**:
   - LinkedIn session cookies (`JSESSIONID`) periodically rotate or expire if active browser sessions trigger CSRF updates. In production, cookie rotation or headless session renewal can be introduced.
2. **Rate Limiting & Anti-Bot Checkpoints**:
   - High request frequencies from single IP addresses may trigger LinkedIn's security checkpoints (CAPTCHA / email verification). For large scale deployments, rotating residential proxies and request throttling should be used.
3. **Private & Restricted Profiles**:
   - Profiles with strict visibility settings (members outside your network or members who configured private visibility) will only return publicly visible subsets of their data.
4. **Pagination on Deep Collections**:
   - The initial profile query retrieves the first batch of entities (up to 20 per collection). Deep profiles with >50 experiences or educations require sub-collection pagination endpoints (`/voyager/api/identity/dash/profiles/{urn}/educations`).

---

## License
MIT
