import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { describe, expect, it } from "vitest";
import { UserAvatar } from "./UserAvatar";

describe("UserAvatar", () => {
  it("shows the picture when the provider supplied one", () => {
    render(
      <UserAvatar
        avatarUrl="https://lh3.googleusercontent.com/a/example"
        initials="JA"
        name="Jane Admin"
      />,
    );

    const img = screen.getByRole("img", { name: "Jane Admin" });
    expect(img).toHaveAttribute("src", "https://lh3.googleusercontent.com/a/example");
    // Google rejects some avatar requests that carry a referrer, which shows
    // up as a picture that loads for one colleague and not another.
    expect(img).toHaveAttribute("referrerPolicy", "no-referrer");
  });

  it("shows initials when there is no picture", () => {
    render(<UserAvatar avatarUrl={null} initials="JA" name="Jane Admin" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("JA")).toBeInTheDocument();
  });

  it("falls back to initials when the picture fails to load", () => {
    render(
      <UserAvatar
        avatarUrl="https://lh3.googleusercontent.com/a/expired"
        initials="JA"
        name="Jane Admin"
      />,
    );

    // Google rotates and expires avatar URLs, so a URL stored at sign-in can
    // be dead a week later. Without this the header shows a broken image,
    // which reads as a bug in the page rather than a stale link.
    fireEvent.error(screen.getByRole("img", { name: "Jane Admin" }));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("JA")).toBeInTheDocument();
  });
});
