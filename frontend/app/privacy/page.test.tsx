import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PrivacyPage from "./page";

vi.mock("@/components/legal/PublicLegalPage", () => ({
  PublicLegalPage: ({ slug }: { slug: string }) => <div>Public legal page for {slug}</div>,
}));

describe("PrivacyPage", () => {
  it("renders PublicLegalPage for the privacy slug", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Public legal page for privacy")).toBeInTheDocument();
  });
});
