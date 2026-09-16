/**
 * Uploads an image for a docs-content field (a feature card's icon, so
 * far). The returned URL is put into the field like any other value and
 * saved through the existing docs-content save call — this endpoint only
 * ever hands back a URL, it never touches docs_content itself.
 */

import { BACKEND_URL } from "@/lib/auth/api";

export class ContentImageApiError extends Error {}

export async function uploadContentImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/admin/content-images`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  } catch {
    throw new ContentImageApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new ContentImageApiError("You don't have permission to upload images. Sign in as an admin and try again.");
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const message =
      detail && typeof detail === "object" && "detail" in detail && typeof detail.detail === "string"
        ? detail.detail
        : undefined;
    throw new ContentImageApiError(message ?? "Couldn't upload that image.");
  }
  const body = (await response.json()) as { url: string };
  return body.url;
}
