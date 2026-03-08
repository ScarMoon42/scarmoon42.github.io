import type { Page } from "../types";

const PAGE_TO_HASH: Record<Page, string> = {
  login: "login",
  "role-selection": "role-selection",
  "teacher-home": "teacher-home",
  "upload-umk": "upload-umk",
  "upload-pk": "upload-pk",
  testing: "testing",
  "student-checklist": "student-checklist",
  "expert-candidate-selection": "expert-candidate-selection",
  "expert-home": "expert-home",
  "expert-documents": "expert-documents",
  "expert-checklist": "expert-checklist",
  "expert-survey": "expert-survey",
  "expert-open-lesson": "expert-open-lesson",
  "secretary-home": "secretary-home",
  "secretary-users": "secretary-users",
  "secretary-assign": "secretary-assign",
  "secretary-rating": "secretary-rating",
  "secretary-upload": "secretary-upload",
  "secretary-metadata": "secretary-metadata",
  "secretary-assignment": "secretary-assignment",
};

const HASH_TO_PAGE: Record<string, Page> = Object.fromEntries(
  (Object.entries(PAGE_TO_HASH) as [Page, string][]).map(([page, hash]) => [hash, page])
);

const VALID_PAGES: Set<string> = new Set(Object.keys(PAGE_TO_HASH));

export function isValidPage(page: unknown): page is Page {
  return typeof page === "string" && VALID_PAGES.has(page);
}

export function getPageFromHash(): Page {
  if (typeof window === "undefined") return "login";
  try {
    const hash = window.location.hash.slice(1).replace(/^\/+/, "") || "login";
    const [pathPart] = hash.split("?");
    const page = HASH_TO_PAGE[pathPart] ?? "login";
    return isValidPage(page) ? page : "login";
  } catch {
    return "login";
  }
}

/** lessonId из URL (#/student-checklist?lessonId=5) */
export function getLessonIdFromHash(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const hash = window.location.hash;
    const queryStart = hash.indexOf("?");
    if (queryStart === -1) return null;
    const params = new URLSearchParams(hash.slice(queryStart + 1));
    const id = params.get("lessonId");
    if (!id) return null;
    const num = parseInt(id, 10);
    return Number.isNaN(num) ? null : num;
  } catch {
    return null;
  }
}

export function pushHistoryForPage(page: Page, candidate?: unknown, lessonId?: number) {
  let hash = PAGE_TO_HASH[page];
  if (page === "student-checklist" && lessonId != null) {
    hash += `?lessonId=${lessonId}`;
  }
  const url = `${window.location.pathname}${window.location.search}#/${hash}`;
  window.history.pushState(
    { page, candidate, lessonId } as { page: Page; candidate?: unknown; lessonId?: number },
    "",
    url
  );
}

export function replaceHistoryForPage(page: Page, candidate?: unknown, lessonId?: number) {
  let hash = PAGE_TO_HASH[page];
  if (page === "student-checklist" && lessonId != null) {
    hash += `?lessonId=${lessonId}`;
  }
  const url = `${window.location.pathname}${window.location.search}#/${hash}`;
  window.history.replaceState({ page, candidate, lessonId } as { page: Page; candidate?: unknown; lessonId?: number }, "", url);
}
