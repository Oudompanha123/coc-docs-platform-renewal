import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  EmailAlreadyRegisteredError,
  changePassword,
  loginWithPassword,
  me,
  register,
} from "./api";

function jsonResponse(body: unknown, init?: Partial<Response>): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    ...init,
  } as Response;
}

describe("me", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the caller's current name and role when a session cookie is present", async () => {
    const body = { id: "1", email: "a@example.com", displayName: "Person Example", role: "USER", authenticated: true };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal("fetch", fetchMock);

    const result = await me();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/me"),
      expect.objectContaining({ credentials: "include" }),
    );
    expect(result).toEqual(body);
  });

  it("returns authenticated:false with no session, rather than throwing", async () => {
    const body = { id: null, email: null, displayName: null, role: null, authenticated: false };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body)));

    await expect(me()).resolves.toEqual(body);
  });
});

describe("loginWithPassword", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts email and password, and returns the account on success", async () => {
    const account = { id: "1", email: "a@example.com", displayName: "A", role: "USER" };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(account));
    vi.stubGlobal("fetch", fetchMock);

    const result = await loginWithPassword("a@example.com", "hunter2222");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/login-password"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ email: "a@example.com", password: "hunter2222" }),
      }),
    );
    expect(result).toEqual(account);
  });

  it("throws a generic AuthApiError on a non-ok response (UC-004 E-3: no reason is exposed)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 401 })));

    await expect(loginWithPassword("a@example.com", "wrong")).rejects.toBeInstanceOf(AuthApiError);
  });

  it("throws a connection-failure AuthApiError when fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));

    await expect(loginWithPassword("a@example.com", "hunter2222")).rejects.toThrow(/reach the server/i);
  });
});

describe("register", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts email, displayName and password, and returns the result on success", async () => {
    const body = { status: "ACTIVE", message: "Your account has been created. You can now log in." };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal("fetch", fetchMock);

    const result = await register({ email: "new@example.com", displayName: "New Person", password: "hunter2222" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/register"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "new@example.com", displayName: "New Person", password: "hunter2222" }),
      }),
    );
    expect(result).toEqual(body);
  });

  it("throws EmailAlreadyRegisteredError specifically on a 409", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 409 })));

    await expect(register({ email: "dup@example.com", displayName: "Dup", password: "hunter2222" })).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
  });

  it("throws a plain AuthApiError (not EmailAlreadyRegisteredError) on other failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 400 })));

    const failure = register({ email: "bad", displayName: "Bad", password: "x" });

    await expect(failure).rejects.toBeInstanceOf(AuthApiError);
    await expect(failure).rejects.not.toBeInstanceOf(EmailAlreadyRegisteredError);
  });
});

describe("changePassword", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts both password fields and returns the confirmation message", async () => {
    const body = { message: "Password created successfully. You can now access your account." };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal("fetch", fetchMock);

    const result = await changePassword("NewPassword456!", "NewPassword456!");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/change-password"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ newPassword: "NewPassword456!", confirmPassword: "NewPassword456!" }),
      }),
    );
    expect(result).toEqual(body.message);
  });

  it("surfaces the server's own detail message on a rejection, e.g. reusing the temporary password", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { detail: "choose a password different from your current one" },
          { ok: false, status: 400 },
        ),
      ),
    );

    await expect(changePassword("SamePassword1!", "SamePassword1!")).rejects.toThrow(
      "choose a password different from your current one",
    );
  });

  it("throws a connection-failure AuthApiError when fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));

    await expect(changePassword("NewPassword456!", "NewPassword456!")).rejects.toThrow(/reach the server/i);
  });
});
