import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  EmailAlreadyRegisteredError,
  changePassword,
  forgotPassword,
  loginWithPassword,
  me,
  register,
  resendRegistrationCode,
  verifyRegistrationCode,
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

  it("posts email, displayName and password, and returns a code-sent challenge, not an account (ADR-021)", async () => {
    const body = {
      message: "We've sent a 6-digit verification code to new@example.com. It expires in 10 minutes.",
      expiresInSeconds: 600,
    };
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

  it("throws the backend's cooldown message on a 429 (resubmission treated like a resend)", async () => {
    const body = { detail: "A code was just sent to this address. Please wait a moment before requesting another." };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body, { ok: false, status: 429 })));

    await expect(register({ email: "new@example.com", displayName: "New Person", password: "hunter2222" })).rejects.toThrow(
      "A code was just sent to this address. Please wait a moment before requesting another.",
    );
  });

  it("throws a plain AuthApiError (not EmailAlreadyRegisteredError) on other failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 400 })));

    const failure = register({ email: "bad", displayName: "Bad", password: "x" });

    await expect(failure).rejects.toBeInstanceOf(AuthApiError);
    await expect(failure).rejects.not.toBeInstanceOf(EmailAlreadyRegisteredError);
  });
});

describe("resendRegistrationCode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the email and returns a fresh challenge on success", async () => {
    const body = { message: "We've sent a 6-digit verification code to new@example.com. It expires in 10 minutes.", expiresInSeconds: 600 };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal("fetch", fetchMock);

    const result = await resendRegistrationCode("new@example.com");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/register/resend"),
      expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "new@example.com" }) }),
    );
    expect(result).toEqual(body);
  });

  it("surfaces the backend's own message on failure rather than a generic one", async () => {
    const body = { detail: "No registration is pending for this email. Please start registration again." };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body, { ok: false, status: 400 })));

    await expect(resendRegistrationCode("nobody@example.com")).rejects.toThrow(
      "No registration is pending for this email. Please start registration again.",
    );
  });
});

describe("verifyRegistrationCode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the email and code, and returns the pending-approval result on success", async () => {
    const body = {
      status: "PENDING",
      message: "Your email is verified and your registration has been received. An administrator has to approve it before you can sign in.",
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyRegistrationCode("new@example.com", "123456");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/register/verify"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "new@example.com", code: "123456" }),
      }),
    );
    expect(result).toEqual(body);
  });

  it("reports an incorrect or expired code plainly, from the backend's own message", async () => {
    const body = { detail: "That code is incorrect. Please try again." };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body, { ok: false, status: 400 })));

    await expect(verifyRegistrationCode("new@example.com", "000000")).rejects.toThrow(
      "That code is incorrect. Please try again.",
    );
  });
});

describe("forgotPassword", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the backend's generic message on success", async () => {
    const body = { message: "If that email is registered, we've sent password reset instructions." };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal("fetch", fetchMock);

    const result = await forgotPassword("anyone@example.com");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/forgot-password"),
      expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "anyone@example.com" }) }),
    );
    expect(result).toEqual(body.message);
  });

  it("throws the exact 'no account found' message on a 404 (ADR-019)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 404 })));

    await expect(forgotPassword("nobody@example.com")).rejects.toThrow(
      "No account found with this email address.",
    );
  });

  it("throws a generic AuthApiError on other failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 400 })));

    await expect(forgotPassword("not-an-email")).rejects.toBeInstanceOf(AuthApiError);
  });
});

describe("changePassword", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts all three password fields and returns the confirmation message", async () => {
    const body = { message: "Password created successfully. You can now access your account." };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal("fetch", fetchMock);

    const result = await changePassword("NewPassword456!", "NewPassword456!", "TempPassword123!");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/change-password"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          currentPassword: "TempPassword123!",
          newPassword: "NewPassword456!",
          confirmPassword: "NewPassword456!",
        }),
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

    await expect(
      changePassword("SamePassword1!", "SamePassword1!", "SamePassword1!"),
    ).rejects.toThrow("choose a password different from your current one");
  });

  it("throws a connection-failure AuthApiError when fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));

    await expect(
      changePassword("NewPassword456!", "NewPassword456!", "TempPassword123!"),
    ).rejects.toThrow(/reach the server/i);
  });

  it("posts currentPassword for the voluntary change too (ADR-022)", async () => {
    const body = { message: "Your password has been changed." };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal("fetch", fetchMock);

    const result = await changePassword("NewPassword456!", "NewPassword456!", "OldPassword123!");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/change-password"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          currentPassword: "OldPassword123!",
          newPassword: "NewPassword456!",
          confirmPassword: "NewPassword456!",
        }),
      }),
    );
    expect(result).toEqual(body.message);
  });

  it("surfaces the backend's own message when the current password is wrong", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ detail: "your current password is incorrect" }, { ok: false, status: 400 }),
      ),
    );

    await expect(
      changePassword("NewPassword456!", "NewPassword456!", "WrongPassword!!!"),
    ).rejects.toThrow("your current password is incorrect");
  });
});
