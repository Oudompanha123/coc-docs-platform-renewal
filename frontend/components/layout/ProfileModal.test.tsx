import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@/lib/auth/api";
import { ProfileModal } from "./ProfileModal";

const { uploadAvatar, removeAvatar, refresh } = vi.hoisted(() => ({
  uploadAvatar: vi.fn(),
  removeAvatar: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, uploadAvatar, removeAvatar };
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
    hasPassword: true,
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
 * Display name, password and notifications are edited on the Settings
 * pages; this popup only shows the account's details (and its photo).
 */
describe("ProfileModal details", () => {
  it("shows the account details with no editable fields", () => {
    render(<ProfileModal onClose={vi.fn()} />);

    expect(screen.getByText("person@example.com")).toBeInTheDocument();
    expect(screen.queryByLabelText("Display name")).not.toBeInTheDocument();
    expect(screen.queryByText("Password")).not.toBeInTheDocument();
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();
  });

  it("Edit Profile links to the settings page", () => {
    render(<ProfileModal onClose={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Edit Profile" })).toHaveAttribute(
      "href",
      "/account/settings#account",
    );
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
