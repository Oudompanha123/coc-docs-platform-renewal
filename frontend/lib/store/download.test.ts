import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadBuild, percentOf } from "@/lib/store/download";

function streamOf(...parts: number[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const n of parts) controller.enqueue(new Uint8Array(n));
      controller.close();
    },
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("percentOf", () => {
  it("is a whole percentage, capped at 100", () => {
    expect(percentOf(50, 200)).toBe(25);
    expect(percentOf(999, 200)).toBe(100);
  });
  it("is null when the total is unknown", () => {
    expect(percentOf(10, null)).toBeNull();
    expect(percentOf(10, 0)).toBeNull();
  });
});

describe("downloadBuild", () => {
  afterEach(() => vi.unstubAllGlobals());

  const build = { downloadUrl: "/api/v1/store/builds/x/download", fileName: "app.apk", sizeBytes: 10 };

  function stubSaving() {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: () => {} }));
  }

  it("asks the backend for a link, then streams a presigned S3 URL without cookies, reporting progress", async () => {
    stubSaving();
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith("/download-link")
        ? json({ url: "https://s3.example.com/bucket/key?X-Amz-Expires=300", presigned: true })
        : new Response(streamOf(4, 6), { headers: { "content-length": "10" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const seen: Array<[number, number | null]> = [];

    await downloadBuild(build, (loaded, total) => seen.push([loaded, total]));

    expect(seen).toEqual([
      [4, 10],
      [10, 10],
    ]);
    const [linkUrl, linkInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(linkUrl).toContain("/api/v1/store/builds/x/download-link");
    expect(linkInit.credentials).toBe("include");
    const [fileUrl, fileInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(fileUrl).toBe("https://s3.example.com/bucket/key?X-Amz-Expires=300");
    // The presigned URL is authorised by its signature; the session cookie must not go to S3.
    expect(fileInit.credentials).toBeUndefined();
  });

  it("streams from the backend itself, with cookies, when storage is local", async () => {
    stubSaving();
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith("/download-link")
        ? json({ url: "/api/v1/store/builds/x/download", presigned: false })
        : new Response(streamOf(10), { headers: { "content-length": "10" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await downloadBuild(build, () => {});

    const [fileUrl, fileInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(fileUrl).toContain("/api/v1/store/builds/x/download");
    expect(fileInit.credentials).toBe("include");
  });

  it("explains a build the backend refuses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({}, 404)));
    await expect(downloadBuild(build, () => {})).rejects.toThrow("no longer available");
  });

  it("explains an expired presigned link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("/download-link") ? json({ url: "https://s3.example.com/k", presigned: true }) : new Response("", { status: 403 }),
      ),
    );
    await expect(downloadBuild(build, () => {})).rejects.toThrow("link expired");
  });

  it("explains an unreachable server", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(downloadBuild(build, () => {})).rejects.toThrow("Couldn't reach the server");
  });
});
