import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TermsPage from "./page";

vi.mock("@/components/legal/PublicLegalPage", () => ({
  PublicLegalPage: ({ slug }: { slug: string }) => <div>Public legal page for {slug}</div>,
}));

describe("TermsPage", () => {
  it("renders PublicLegalPage for the terms slug", () => {
    render(<TermsPage />);
    expect(screen.getByText("Public legal page for terms")).toBeInTheDocument();
  });
});
