import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { canOpenDashboard, formatLastSignIn, ProfilePopup } from "./ProfilePopup";
import { AuthApiError } from "@/lib/auth/api";
import type { Role } from "@/lib/auth/api";

const { sessionUser, fetchMyAttendance, uploadAvatar, removeAvatar, refresh } = vi.hoisted(() => ({
  sessionUser: {
    displayName: "Neo Chanthy",
    email: "thythy8292@gmail.com",
    role: "user" as Role,
    avatarUrl: null as string | null,
    lastSignInAt: null as string | null,
  },
  fetchMyAttendance: vi.fn(),
  uploadAvatar: vi.fn(),
  removeAvatar: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/auth/SessionProvider", () => ({ useSession: () => ({ user: sessionUser, refresh }) }));
vi.mock("@/lib/me/attendance", () => ({ fetchMyAttendance }));
vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, uploadAvatar, removeAvatar };
});

beforeEach(() => {
  vi.clearAllMocks();
  sessionUser.displayName = "Neo Chanthy";
  sessionUser.email = "thythy8292@gmail.com";
  sessionUser.role = "user";
  sessionUser.avatarUrl = null;
  sessionUser.lastSignInAt = null;
  fetchMyAttendance.mockResolvedValue({ viewerLinked: false, department: null, rows: [] });
});

describe("formatLastSignIn", () => {
  const now = new Date("2026-10-06T13:32:00");

  it("formats today as \"Today, HH:MM\"", () => {
    expect(formatLastSignIn("2026-10-06T13:32:00", now)).toBe("Today, 13:32");
  });

  it("formats an earlier date as \"D MMM YYYY, HH:MM\"", () => {
    expect(formatLastSignIn("2026-09-30T13:32:00", now)).toBe("30 Sep 2026, 13:32");
  });

  it("returns null for no data", () => {
    expect(formatLastSignIn(null, now)).toBeNull();
  });

  it("returns null for an unparsable date", () => {
    expect(formatLastSignIn("not-a-date", now)).toBeNull();
  });
});

describe("canOpenDashboard", () => {
  it.each(["admin", "super_admin"] as const)("true for %s", (role) => {
    expect(canOpenDashboard(role)).toBe(true);
  });

  it.each(["user", "developer", "reviewer", "lead", "guest"] as const)("false for %s", (role) => {
    expect(canOpenDashboard(role)).toBe(false);
  });

  it("false for no role", () => {
    expect(canOpenDashboard(null)).toBe(false);
    expect(canOpenDashboard(undefined)).toBe(false);
  });
});

describe("ProfilePopup", () => {
  it("is a labelled dialog, named after the signed-in user", async () => {
    render(<ProfilePopup onClose={vi.fn()} />);
    const dialog = await screen.findByRole("dialog", { name: "Neo Chanthy" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it.each([
    ["user", "User", "bg-[#f3f4f6]", "text-[#374151]"],
    ["developer", "Developer", "bg-[#ecfdf5]", "text-[#047857]"],
    ["admin", "Admin", "bg-[#e0e7ff]", "text-[#4338ca]"],
    ["super_admin", "Super Admin", "bg-[#5b4fe8]", "text-white"],
  ] as const)("shows the %s role chip in its mockup colors (table B)", async (role, label, bg, text) => {
    sessionUser.role = role;
    render(<ProfilePopup onClose={vi.fn()} />);
    await screen.findByRole("dialog");
    const chip = screen.getByText(label);
    expect(chip).toHaveClass(bg);
    expect(chip).toHaveClass(text);
  });

  it.each(["admin", "super_admin"] as const)("shows Open Dashboard, linking to /overview, for %s", async (role) => {
    sessionUser.role = role;
    render(<ProfilePopup onClose={vi.fn()} />);
    await screen.findByRole("dialog");
    const link = screen.getByRole("link", { name: /open dashboard/i });
    expect(link).toHaveAttribute("href", "/overview");
  });

  it.each(["user", "developer", "reviewer", "lead"] as const)("hides Open Dashboard for %s", async (role) => {
    sessionUser.role = role;
    render(<ProfilePopup onClose={vi.fn()} />);
    await screen.findByRole("dialog");
    expect(screen.queryByRole("link", { name: /open dashboard/i })).not.toBeInTheDocument();
  });

  it("always shows the Open settings button, linking to /account/settings#account", async () => {
    render(<ProfilePopup onClose={vi.fn()} />);
    await screen.findByRole("dialog");
    expect(screen.getByRole("link", { name: /open settings/i })).toHaveAttribute(
      "href",
      "/account/settings#account",
    );
  });

  it("not-linked: shows the — department, the amber Not linked chip, and the HRMS note", async () => {
    fetchMyAttendance.mockResolvedValue({ viewerLinked: false, department: null, rows: [] });
    render(<ProfilePopup onClose={vi.fn()} />);

    expect(await screen.findByText("Not linked")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(
      screen.getByText("Ask an admin to link your HRMS account to see attendance."),
    ).toBeInTheDocument();
  });

  it("linked: shows the department and the green Linked chip, no note", async () => {
    fetchMyAttendance.mockResolvedValue({ viewerLinked: true, department: "COOCON Department", rows: [] });
    render(<ProfilePopup onClose={vi.fn()} />);

    expect(await screen.findByText("Linked")).toBeInTheDocument();
    expect(screen.getByText("COOCON Department")).toBeInTheDocument();
    expect(
      screen.queryByText("Ask an admin to link your HRMS account to see attendance."),
    ).not.toBeInTheDocument();
  });

  it("truncates a long email but keeps the full value in its title", async () => {
    sessionUser.email = "a-very-long-email-address-indeed@example-company.com";
    render(<ProfilePopup onClose={vi.fn()} />);
    const value = await screen.findByTitle("a-very-long-email-address-indeed@example-company.com");
    expect(value).toHaveClass("truncate");
  });

  it("calls onClose when the X button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfilePopup onClose={onClose} />);
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfilePopup onClose={onClose} />);
    const dialog = await screen.findByRole("dialog");

    await user.click(dialog);

    expect(onClose).toHaveBeenCalled();
  });

  it("does not close when the card itself is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfilePopup onClose={onClose} />);
    await screen.findByRole("dialog");

    await user.click(screen.getByText("Neo Chanthy"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfilePopup onClose={onClose} />);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("focuses the close button on open", async () => {
    render(<ProfilePopup onClose={vi.fn()} />);
    await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("Tab from the last focusable element wraps to the first (focus trap)", async () => {
    sessionUser.role = "admin";
    const user = userEvent.setup();
    render(<ProfilePopup onClose={vi.fn()} />);
    await screen.findByRole("dialog");

    const dashboardLink = screen.getByRole("link", { name: /open dashboard/i });
    dashboardLink.focus();
    await user.tab();

    // The photo upload input is the first focusable element in DOM order
    // (it's the first thing in the dialog, visually and structurally), not
    // the close button — initial focus-on-open still goes to Close (its own
    // test above), but wrapping follows DOM order like any focus trap.
    expect(screen.getByLabelText("Upload profile photo")).toHaveFocus();
  });
});

describe("ProfilePopup avatar", () => {
  function pngFile(name = "photo.png") {
    return new File(["fake-bytes"], name, { type: "image/png" });
  }

  it("uploads a chosen photo and refreshes the session", async () => {
    uploadAvatar.mockResolvedValue({});
    const user = userEvent.setup();
    render(<ProfilePopup onClose={vi.fn()} />);
    await screen.findByRole("dialog");

    await user.upload(screen.getByLabelText("Upload profile photo"), pngFile());

    expect(uploadAvatar).toHaveBeenCalledWith(expect.any(File));
    expect(refresh).toHaveBeenCalled();
  });

  it("rejects an unsupported file type client-side, without calling the API", async () => {
    render(<ProfilePopup onClose={vi.fn()} />);
    await screen.findByRole("dialog");

    const notAPhoto = new File(["<svg></svg>"], "photo.svg", { type: "image/svg+xml" });
    fireEvent.change(screen.getByLabelText("Upload profile photo"), { target: { files: [notAPhoto] } });

    expect(await screen.findByText("Photos must be PNG, JPEG, or WebP.")).toBeInTheDocument();
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it("shows the server's rejection when the upload fails", async () => {
    uploadAvatar.mockRejectedValue(new AuthApiError("that file is not a readable image"));
    const user = userEvent.setup();
    render(<ProfilePopup onClose={vi.fn()} />);
    await screen.findByRole("dialog");

    await user.upload(screen.getByLabelText("Upload profile photo"), pngFile());

    expect(await screen.findByText("that file is not a readable image")).toBeInTheDocument();
  });

  it("offers no 'Remove photo' action when the account has no photo", async () => {
    render(<ProfilePopup onClose={vi.fn()} />);
    await screen.findByRole("dialog");
    expect(screen.queryByRole("button", { name: "Remove photo" })).not.toBeInTheDocument();
  });

  it("removes the photo and refreshes the session", async () => {
    sessionUser.avatarUrl = "https://s3.test/bucket/avatars/1/photo.png";
    removeAvatar.mockResolvedValue({});
    const user = userEvent.setup();
    render(<ProfilePopup onClose={vi.fn()} />);
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Remove photo" }));

    expect(removeAvatar).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });
});
