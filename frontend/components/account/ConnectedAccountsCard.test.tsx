import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConnectedAccountsCard } from "./ConnectedAccountsCard";

describe("ConnectedAccountsCard", () => {
  it("shows a green Linked chip and the employee name when linked with data", () => {
    render(<ConnectedAccountsCard state={{ kind: "linked", employeeName: "Chang Techkuang" }} />);

    expect(screen.getByText("Linked")).toBeInTheDocument();
    expect(screen.getByText("Chang Techkuang")).toBeInTheDocument();
  });

  it("shows Linked with no name line when linked but nothing recorded today", () => {
    render(<ConnectedAccountsCard state={{ kind: "linked", employeeName: null }} />);

    expect(screen.getByText("Linked")).toBeInTheDocument();
    expect(screen.getByText("HRMS KOSIGN")).toBeInTheDocument();
  });

  it("shows the amber not-linked box with its exact copy", () => {
    render(<ConnectedAccountsCard state={{ kind: "not-linked" }} />);

    expect(screen.getByText("HRMS KOSIGN — not linked")).toBeInTheDocument();
    expect(
      screen.getByText("Your attendance can't be shown until an admin links your account."),
    ).toBeInTheDocument();
    expect(screen.getByText("Not linked")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    render(<ConnectedAccountsCard state={{ kind: "loading" }} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows an error state", () => {
    render(<ConnectedAccountsCard state={{ kind: "error", message: "Couldn't reach the server." }} />);
    expect(screen.getByText("Couldn't reach the server.")).toBeInTheDocument();
  });
});
