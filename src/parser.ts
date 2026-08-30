/**
 * LinkedIn Voyager Profile Parser
 * Transforms raw normalized Voyager/Restli graph responses into clean, structured JSON.
 */

export interface DateSpec {
  month?: number | null;
  year?: number | null;
  day?: number | null;
  formatted?: string | null;
}

export interface DateRangeSpec {
  start?: DateSpec | null;
  end?: DateSpec | null;
  isCurrent?: boolean;
}

export interface ParsedImage {
  rootUrl?: string | null;
  url?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface ParsedExperience {
  title: string;
  companyName: string;
  companyUrn?: string | null;
  companyUrl?: string | null;
  companyLogo?: string | null;
  locationName?: string | null;
  dateRange?: DateRangeSpec | null;
  description?: string | null;
}

export interface ParsedEducation {
  schoolName: string;
  schoolUrn?: string | null;
  degreeName?: string | null;
  fieldOfStudy?: string | null;
  grade?: string | null;
  activities?: string | null;
  description?: string | null;
  dateRange?: DateRangeSpec | null;
}

export interface ParsedCertification {
  name: string;
  authority?: string | null;
  url?: string | null;
  licenseNumber?: string | null;
  dateRange?: DateRangeSpec | null;
}

export interface ParsedLanguage {
  name: string;
  proficiency?: string | null;
}

export interface ParsedProject {
  title: string;
  description?: string | null;
  url?: string | null;
  dateRange?: DateRangeSpec | null;
}

export interface ParsedVolunteer {
  role: string;
  organizationName: string;
  cause?: string | null;
  description?: string | null;
  dateRange?: DateRangeSpec | null;
}

export interface ParsedHonor {
  title: string;
  issuer?: string | null;
  issueDate?: DateSpec | null;
  description?: string | null;
}

export interface ParsedPublication {
  name: string;
  publisher?: string | null;
  publishedDate?: DateSpec | null;
  url?: string | null;
  description?: string | null;
}

export interface ParsedProfile {
  publicIdentifier: string;
  entityUrn: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string | null;
  about: string | null;
  location: {
    countryCode?: string | null;
    name?: string | null;
  };
  profilePicture: {
    displayUrl?: string | null;
    raw?: any;
  } | null;
  backgroundPicture: {
    displayUrl?: string | null;
  } | null;
  experiences: ParsedExperience[];
  educations: ParsedEducation[];
  skills: string[];
  certifications: ParsedCertification[];
  languages: ParsedLanguage[];
  projects: ParsedProject[];
  volunteerExperiences: ParsedVolunteer[];
  honors: ParsedHonor[];
  publications: ParsedPublication[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDate(dateObj: any): DateSpec | null {
  if (!dateObj) return null;
  const month = dateObj.month || null;
  const year = dateObj.year || null;
  const day = dateObj.day || null;

  let formatted = "";
  if (month && MONTH_NAMES[month - 1]) {
    formatted += `${MONTH_NAMES[month - 1]} `;
  }
  if (day) {
    formatted += `${day}, `;
  }
  if (year) {
    formatted += `${year}`;
  }

  return {
    month,
    year,
    day,
    formatted: formatted.trim() || null,
  };
}

function formatDateRange(rangeObj: any): DateRangeSpec | null {
  if (!rangeObj) return null;
  const start = formatDate(rangeObj.start);
  const end = formatDate(rangeObj.end);
  const isCurrent = !!(start && !end);

  return {
    start,
    end,
    isCurrent,
  };
}

function extractVectorImageUrl(vectorImage: any): string | null {
  if (!vectorImage || !vectorImage.rootUrl || !Array.isArray(vectorImage.artifacts)) {
    return null;
  }
  // Pick the largest artifact available or the last one
  const artifacts = [...vectorImage.artifacts].sort(
    (a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0)
  );

  const bestArtifact = artifacts[0] || vectorImage.artifacts[0];
  if (bestArtifact && bestArtifact.fileIdentifyingUrlPathSegment) {
    return `${vectorImage.rootUrl}${bestArtifact.fileIdentifyingUrlPathSegment}`;
  }
  return null;
}

function extractPhotoUrl(pictureObj: any): string | null {
  if (!pictureObj) return null;
  if (pictureObj.vectorImage) {
    return extractVectorImageUrl(pictureObj.vectorImage);
  }
  if (pictureObj.displayImageReference?.vectorImage) {
    return extractVectorImageUrl(pictureObj.displayImageReference.vectorImage);
  }
  if (pictureObj.displayImage) {
    return extractPhotoUrl(pictureObj.displayImage);
  }
  return null;
}

export function parseLinkedInResponse(raw: any): ParsedProfile | null {
  if (!raw) return null;

  const included: any[] = Array.isArray(raw.included) ? raw.included : [];

  // Build entity lookup map by entityUrn
  const entityMap = new Map<string, any>();
  for (const item of included) {
    if (item.entityUrn) {
      entityMap.set(item.entityUrn, item);
    }
  }

  // Find the primary Profile entity
  const profileEntity = included.find(
    (item) => item.$type === "com.linkedin.voyager.dash.identity.profile.Profile"
  );

  if (!profileEntity) {
    return null;
  }

  const firstName = profileEntity.firstName || profileEntity.multiLocaleFirstName?.en_US || "";
  const lastName = profileEntity.lastName || profileEntity.multiLocaleLastName?.en_US || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const headline = profileEntity.headline || profileEntity.multiLocaleHeadline?.en_US || null;
  const about = profileEntity.summary || profileEntity.multiLocaleSummary?.en_US || null;

  // Resolve Geo / Location
  let locationName: string | null = null;
  if (profileEntity.geoLocation?.geoUrn) {
    const geoEntity = entityMap.get(profileEntity.geoLocation.geoUrn);
    if (geoEntity?.defaultLocalizedName) {
      locationName = geoEntity.defaultLocalizedName;
    }
  }
  if (!locationName && profileEntity.locationName) {
    locationName = profileEntity.locationName;
  }

  const location = {
    countryCode: profileEntity.location?.countryCode || null,
    name: locationName,
  };

  // Profile & Background Images
  const profilePicUrl = extractPhotoUrl(profileEntity.profilePicture);
  const bgPicUrl = extractPhotoUrl(profileEntity.backgroundPicture);

  // Parse Positions / Experience
  const experiences: ParsedExperience[] = [];
  const positionEntities = included.filter(
    (item) => item.$type === "com.linkedin.voyager.dash.identity.profile.Position"
  );

  for (const pos of positionEntities) {
    const title = pos.title || pos.multiLocaleTitle?.en_US || "";
    let companyName = pos.companyName || pos.multiLocaleCompanyName?.en_US || "";
    let companyUrl: string | null = null;
    let companyLogo: string | null = null;

    if (pos.companyUrn || pos["*company"]) {
      const compEntity = entityMap.get(pos.companyUrn || pos["*company"]);
      if (compEntity) {
        if (!companyName && compEntity.name) companyName = compEntity.name;
        if (compEntity.url) companyUrl = compEntity.url;
        if (compEntity.logo?.vectorImage) {
          companyLogo = extractVectorImageUrl(compEntity.logo.vectorImage);
        }
      }
    }

    experiences.push({
      title,
      companyName,
      companyUrn: pos.companyUrn || pos["*company"] || null,
      companyUrl,
      companyLogo,
      locationName: pos.locationName || null,
      dateRange: formatDateRange(pos.dateRange),
      description: pos.description || pos.multiLocaleDescription?.en_US || null,
    });
  }

  // Parse Educations
  const educations: ParsedEducation[] = [];
  const educationEntities = included.filter(
    (item) => item.$type === "com.linkedin.voyager.dash.identity.profile.Education"
  );

  for (const edu of educationEntities) {
    educations.push({
      schoolName: edu.schoolName || edu.multiLocaleSchoolName?.en_US || "",
      schoolUrn: edu.schoolUrn || edu.companyUrn || null,
      degreeName: edu.degreeName || edu.multiLocaleDegreeName?.en_US || null,
      fieldOfStudy: edu.fieldOfStudy || edu.multiLocaleFieldOfStudy?.en_US || null,
      grade: edu.grade || null,
      activities: edu.activities || null,
      description: edu.description || edu.multiLocaleDescription?.en_US || null,
      dateRange: formatDateRange(edu.dateRange),
    });
  }

  // Parse Skills
  const skills: string[] = [];
  const skillEntities = included.filter(
    (item) => item.$type === "com.linkedin.voyager.dash.identity.profile.Skill"
  );
  for (const sk of skillEntities) {
    const skillName = sk.name || sk.multiLocaleName?.en_US;
    if (skillName && !skills.includes(skillName)) {
      skills.push(skillName);
    }
  }

  // Parse Certifications
  const certifications: ParsedCertification[] = [];
  const certEntities = included.filter(
    (item) =>
      item.$type === "com.linkedin.voyager.dash.identity.profile.Certification" ||
      item.$type?.includes("Certification")
  );
  for (const cert of certEntities) {
    if (cert.name || cert.multiLocaleName?.en_US) {
      certifications.push({
        name: cert.name || cert.multiLocaleName?.en_US || "",
        authority: cert.authority || cert.companyName || null,
        url: cert.url || null,
        licenseNumber: cert.licenseNumber || null,
        dateRange: formatDateRange(cert.dateRange),
      });
    }
  }

  // Parse Languages
  const languages: ParsedLanguage[] = [];
  const langEntities = included.filter(
    (item) =>
      item.$type === "com.linkedin.voyager.dash.identity.profile.Language" ||
      item.$type?.includes("Language")
  );
  for (const lang of langEntities) {
    if (lang.name || lang.multiLocaleName?.en_US) {
      languages.push({
        name: lang.name || lang.multiLocaleName?.en_US || "",
        proficiency: lang.proficiency || null,
      });
    }
  }

  // Parse Projects
  const projects: ParsedProject[] = [];
  const projEntities = included.filter(
    (item) => item.$type === "com.linkedin.voyager.dash.identity.profile.Project"
  );
  for (const proj of projEntities) {
    projects.push({
      title: proj.title || proj.multiLocaleTitle?.en_US || "",
      description: proj.description || proj.multiLocaleDescription?.en_US || null,
      url: proj.url || null,
      dateRange: formatDateRange(proj.dateRange),
    });
  }

  // Parse Volunteer Experiences
  const volunteerExperiences: ParsedVolunteer[] = [];
  const volEntities = included.filter(
    (item) => item.$type === "com.linkedin.voyager.dash.identity.profile.VolunteerExperience"
  );
  for (const vol of volEntities) {
    volunteerExperiences.push({
      role: vol.role || "",
      organizationName: vol.companyName || "",
      cause: vol.cause || null,
      description: vol.description || null,
      dateRange: formatDateRange(vol.dateRange),
    });
  }

  // Parse Honors
  const honors: ParsedHonor[] = [];
  const honorEntities = included.filter(
    (item) => item.$type === "com.linkedin.voyager.dash.identity.profile.Honor"
  );
  for (const hon of honorEntities) {
    honors.push({
      title: hon.title || "",
      issuer: hon.issuer || null,
      issueDate: formatDate(hon.issueDate),
      description: hon.description || null,
    });
  }

  // Parse Publications
  const publications: ParsedPublication[] = [];
  const pubEntities = included.filter(
    (item) => item.$type === "com.linkedin.voyager.dash.identity.profile.Publication"
  );
  for (const pub of pubEntities) {
    publications.push({
      name: pub.name || "",
      publisher: pub.publisher || null,
      publishedDate: formatDate(pub.publishedDate),
      url: pub.url || null,
      description: pub.description || null,
    });
  }

  return {
    publicIdentifier: profileEntity.publicIdentifier || "",
    entityUrn: profileEntity.entityUrn || "",
    firstName,
    lastName,
    fullName,
    headline,
    about,
    location,
    profilePicture: profilePicUrl ? { displayUrl: profilePicUrl, raw: profileEntity.profilePicture } : null,
    backgroundPicture: bgPicUrl ? { displayUrl: bgPicUrl } : null,
    experiences,
    educations,
    skills,
    certifications,
    languages,
    projects,
    volunteerExperiences,
    honors,
    publications,
  };
}
