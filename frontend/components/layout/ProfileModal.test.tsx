import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@/lib/auth/api";
import { ProfileModal } from "./ProfileModal";

const { updateProfile, changePassword, uploadAvatar, removeAvatar, refresh } = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  uploadAvatar: vi.fn(),
  removeAvatar: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, updateProfile, changePassword, uploadAvatar, removeAvatar };
});

const { sessionUser } = vi.hoisted(() => ({
  sessionUser: {
    id: "1",
    email: "person@example.com",
    displayName: "Person Example",
    role: "user",
    createdAt: "2026-01-01T00:00:00Z",
    lastSignInAt: "2026-09-14T08:00:00Z",
    avatarUrl: null as string | null,
    authenticated: true,
  },
}));

vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({
    status: "authenticated",
    user: sessionUser,
    signOut: vi.fn(),
    refresh,
  }),
}));

/**
 * "Change password" here was a dead button until ADR-022 — these pin that
 * clicking it now does something real, sharing the same {@code
 * ChangePasswordForm} its own test file covers in detail (validation,
 * submission, error surfacing are not re-tested here).
 */
describe("ProfileModal password", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reveals the change-password form on click, replacing the button", async () => {
    const user = userEvent.setup();
    render(<ProfileModal onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change password" })).not.toBeInTheDocument();
  });

  it("shows the server's confirmation and collapses the form back on success", async () => {
    changePassword.mockResolvedValue("Your password has been changed.");
    const user = userEvent.setup();
    render(<ProfileModal onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Change password" }));
    await user.type(screen.getByLabelText("Current Password"), "OldPassword123!");
    await user.type(screen.getByLabelText("New Password"), "NewPassword456!");
    await user.type(screen.getByLabelText("Confirm New Password"), "NewPassword456!");
    await user.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByText("Your password has been changed.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Current Password")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change password" })).toBeInTheDocument();
  });

  it("cancel hides the form without submitting", async () => {
    const user = userEvent.setup();
    render(<ProfileModal onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Change password" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByLabelText("Current Password")).not.toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("does not disturb the display-name save flow", async () => {
    updateProfile.mockResolvedValue({});
    const user = userEvent.setup();
    render(<ProfileModal onClose={onClose} />);

    const nameField = screen.getByLabelText("Display name");
    await user.clear(nameField);
    await user.type(nameField, "New Name");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateProfile).toHaveBeenCalledWith("New Name");
  });

  it("shows a plain error if the server rejects the change", async () => {
    changePassword.mockRejectedValue(new AuthApiError("your current password is incorrect"));
    const user = userEvent.setup();
    render(<ProfileModal onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Change password" }));
    await user.type(screen.getByLabelText("Current Password"), "WrongPassword!!!");
    await user.type(screen.getByLabelText("New Password"), "NewPassword456!");
    await user.type(screen.getByLabelText("Confirm New Password"), "NewPassword456!");
    await user.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByText("your current password is incorrect")).toBeInTheDocument();
    // Still open -- a rejected change must not look like it succeeded.
    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
  });
});

/** ADR-026. */
describe("ProfileModal avatar", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionUser.avatarUrl = null;
  });

  function pngFile(name = "photo.png") {
    return new File(["fake-bytes"], name, { type: "image/png" });
  }

  it("uploads a chosen photo and refreshes the session", async () => {
    uploadAvatar.mockResolvedValue({});
    const user = userEvent.setup();
    render(<ProfileModal onClose={onClose} />);

    await user.upload(screen.getByLabelText("Upload profile photo"), pngFile());

    expect(uploadAvatar).toHaveBeenCalledWith(expect.any(File));
    expect(await screen.findByText("Change photo")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("rejects an unsupported file type client-side, without calling the API", async () => {
    render(<ProfileModal onClose={onClose} />);

    const notAPhoto = new File(["<svg></svg>"], "photo.svg", { type: "image/svg+xml" });
    // fireEvent rather than userEvent.upload: the input's `accept` attribute
    // already keeps a real file picker from offering this type at all, and
    // userEvent.upload emulates that filter too, so this test — proving the
    // JS-level guard behind it also works — has to set the file directly.
    fireEvent.change(screen.getByLabelText("Upload profile photo"), { target: { files: [notAPhoto] } });

    expect(await screen.findByText("Photos must be PNG, JPEG, or WebP.")).toBeInTheDocument();
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it("shows the server's rejection when the upload fails", async () => {
    uploadAvatar.mockRejectedValue(new AuthApiError("that file is not a readable image"));
    const user = userEvent.setup();
    render(<ProfileModal onClose={onClose} />);

    await user.upload(screen.getByLabelText("Upload profile photo"), pngFile());

    expect(await screen.findByText("that file is not a readable image")).toBeInTheDocument();
  });

  it("offers no 'Remove photo' action when the account has no photo", () => {
    render(<ProfileModal onClose={onClose} />);

    expect(screen.queryByRole("button", { name: "Remove photo" })).not.toBeInTheDocument();
  });

  it("removes the photo and refreshes the session", async () => {
    sessionUser.avatarUrl = "https://s3.test/bucket/avatars/1/photo.png";
    removeAvatar.mockResolvedValue({});
    const user = userEvent.setup();
    render(<ProfileModal onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Remove photo" }));

    expect(removeAvatar).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });
});
