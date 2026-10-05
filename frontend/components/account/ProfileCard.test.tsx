import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileCard } from "./ProfileCard";

const { updateProfile, refresh } = vi.hoisted(() => ({ updateProfile: vi.fn(), refresh: vi.fn() }));

vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, updateProfile };
});

const { sessionUser } = vi.hoisted(() => ({
  sessionUser: {
    email: "dana@example.com",
    displayName: "Dana Lee",
    role: "user",
    avatarUrl: null as string | null,
  },
}));

vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ user: sessionUser, refresh }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionUser.displayName = "Dana Lee";
});

describe("ProfileCard", () => {
  it("renders as the Account section — id, title, and subtitle all renamed from Profile", () => {
    const { container } = render(<ProfileCard department={null} onSaved={vi.fn()} onError={vi.fn()} />);

    expect(container.querySelector("#account")).not.toBeNull();
    expect(container.querySelector("#profile")).toBeNull();
    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByText("Your account details on Coc Docs Platform.")).toBeInTheDocument();
  });

  it("shows email, role, and department as read-only, with their hint text", () => {
    render(<ProfileCard department="COOCON Department" onSaved={vi.fn()} onError={vi.fn()} />);

    expect(screen.getByDisplayValue("dana@example.com")).toBeDisabled();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("COOCON Department")).toBeInTheDocument();
    expect(screen.getByText("Linked to your Google sign-in. Can't be changed here.")).toBeInTheDocument();
    expect(screen.getByText("Only an admin can change your role.")).toBeInTheDocument();
  });

  it("shows — for department when not linked", () => {
    render(<ProfileCard department={null} onSaved={vi.fn()} onError={vi.fn()} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("Save changes is disabled until the display name actually changes", async () => {
    const user = userEvent.setup();
    render(<ProfileCard department={null} onSaved={vi.fn()} onError={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();

    await user.type(screen.getByDisplayValue("Dana Lee"), "!");
    expect(screen.getByRole("button", { name: "Save changes" })).not.toBeDisabled();
  });

  it("saves for real: calls updateProfile with the trimmed name, then refreshes the session and notifies success", async () => {
    updateProfile.mockResolvedValue({});
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<ProfileCard department={null} onSaved={onSaved} onError={vi.fn()} />);

    const input = screen.getByDisplayValue("Dana Lee");
    await user.clear(input);
    await user.type(input, "  Dana Renamed  ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateProfile).toHaveBeenCalledWith("Dana Renamed");
    expect(refresh).toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
  });

  it("a blank or whitespace-only name never becomes savable", async () => {
    const user = userEvent.setup();
    render(<ProfileCard department={null} onSaved={vi.fn()} onError={vi.fn()} />);

    const input = screen.getByDisplayValue("Dana Lee");
    await user.clear(input);
    await user.type(input, "   ");

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("rejects a display name over 50 characters", async () => {
    const user = userEvent.setup();
    render(<ProfileCard department={null} onSaved={vi.fn()} onError={vi.fn()} />);

    const input = screen.getByDisplayValue("Dana Lee") as HTMLInputElement;
    // maxLength=50 on the input itself already prevents typing past the
    // limit — set the value directly to confirm validateDisplayName still
    // refuses one that somehow arrives longer (e.g. pasted).
    await user.clear(input);
    input.removeAttribute("maxlength");
    await user.type(input, "x".repeat(51));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Display name must be 50 characters or fewer.")).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("Cancel reverts the field to the saved name", async () => {
    const user = userEvent.setup();
    render(<ProfileCard department={null} onSaved={vi.fn()} onError={vi.fn()} />);

    const input = screen.getByDisplayValue("Dana Lee");
    await user.type(input, "!");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByDisplayValue("Dana Lee")).toBeInTheDocument();
  });

  it("surfaces a save failure via onError, without crashing", async () => {
    updateProfile.mockRejectedValue(new Error("network down"));
    const onError = vi.fn();
    const user = userEvent.setup();
    render(<ProfileCard department={null} onSaved={vi.fn()} onError={onError} />);

    const input = screen.getByDisplayValue("Dana Lee");
    await user.type(input, "!");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onError).toHaveBeenCalledWith("network down");
  });
});
