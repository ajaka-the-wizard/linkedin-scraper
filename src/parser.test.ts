import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseLinkedInResponse } from "./parser.js";

const rawFixture = JSON.parse(
  readFileSync(new URL("../example.json", import.meta.url), "utf8")
);

describe("parseLinkedInResponse", () => {
  it("normalizes the profile and resolves its geographical entity", () => {
    const profile = parseLinkedInResponse(rawFixture);

    expect(profile).toMatchObject({
      publicIdentifier: "jane-doe",
      entityUrn: "urn:li:fsd_profile:synthetic-profile",
      firstName: "Jane",
      lastName: "Doe",
      fullName: "Jane Doe",
      headline: "Software Engineer",
      about: "A synthetic profile summary used only for parser development.",
      location: {
        countryCode: "US",
        name: "Example City",
      },
      profilePicture: null,
      backgroundPicture: null,
    });
  });

  it("normalizes related experience, education, skills, and projects", () => {
    const profile = parseLinkedInResponse(rawFixture);

    expect(profile).not.toBeNull();
    expect(profile!.experiences).toEqual([
      {
        title: "Software Engineer",
        companyName: "Example Company",
        companyUrn: "urn:li:fsd_company:synthetic-company",
        companyUrl: "https://www.linkedin.com/company/example-company/",
        companyLogo: null,
        locationName: "Example City, United States",
        dateRange: {
          start: {
            month: 6,
            year: 2024,
            day: null,
            formatted: "June 2024",
          },
          end: null,
          isCurrent: true,
        },
        description: "Built and maintained backend services for an example product.",
      },
    ]);
    expect(profile!.educations).toEqual([
      {
        schoolName: "Example University",
        schoolUrn: "urn:li:fsd_company:synthetic-school",
        degreeName: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        grade: null,
        activities: null,
        description: "A synthetic education record used only for parser development.",
        dateRange: {
          start: {
            month: 9,
            year: 2018,
            day: null,
            formatted: "September 2018",
          },
          end: {
            month: 6,
            year: 2022,
            day: null,
            formatted: "June 2022",
          },
          isCurrent: false,
        },
      },
    ]);
    expect(profile!.skills).toEqual(["TypeScript", "Distributed Systems"]);
    expect(profile!.projects).toEqual([
      {
        title: "Example Task Scheduler",
        description: "A synthetic project record used only for parser development.",
        url: "https://example.test/projects/task-scheduler",
        dateRange: {
          start: {
            month: 11,
            year: 2023,
            day: null,
            formatted: "November 2023",
          },
          end: {
            month: 2,
            year: 2024,
            day: null,
            formatted: "February 2024",
          },
          isCurrent: false,
        },
      },
    ]);
  });

  it("returns empty arrays for profile sections absent from the fixture", () => {
    const profile = parseLinkedInResponse(rawFixture);

    expect(profile).not.toBeNull();
    expect(profile!.certifications).toEqual([]);
    expect(profile!.languages).toEqual([]);
    expect(profile!.volunteerExperiences).toEqual([]);
    expect(profile!.honors).toEqual([]);
    expect(profile!.publications).toEqual([]);
  });

  it("returns null when the payload does not contain a profile entity", () => {
    expect(parseLinkedInResponse({ included: [] })).toBeNull();
  });
});
