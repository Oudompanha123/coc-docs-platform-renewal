import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { startMfaSetup, verifyMfaSetup } = vi.hoisted(() => ({
  startMfaSetup: vi.fn(),
  verifyMfaSetup: vi.fn(),
}));
vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, startMfaSetup, verifyMfaSetup };
});

import { AuthApiError } from "@/lib/auth/api";
import { TotpSetupWizard } from "./TotpSetupForm";

describe("TotpSetupWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startMfaSetup.mockResolvedValue({ secret: "JBSWY3DPEHPK3PXP", qrCodeDataUri: "data:image/png;base64,AA==" });
  });

  it("clears and refocuses the code field after a wrong code, keeping the error until the next try", async () => {
    verifyMfaSetup.mockRejectedValueOnce(new AuthApiError("That code is incorrect."));
    verifyMfaSetup.mockResolvedValueOnce("Two-factor authentication is on.");
    const onEnabled = vi.fn();
    const user = userEvent.setup();
    render(<TotpSetupWizard onEnabled={onEnabled} onCancel={vi.fn()} />);

    const field = await screen.findByLabelText("Verification Code");
    await user.type(field, "000000");
    await user.click(screen.getByRole("button", { name: "Verify & turn on" }));

    expect(await screen.findByText("That code is incorrect.")).toBeInTheDocument();
    expect(field).toHaveValue("");
    expect(field).toHaveFocus();
    expect(onEnabled).not.toHaveBeenCalled();

    // A new code goes straight in and verifies as normal.
    await user.type(field, "123456");
    await user.click(screen.getByRole("button", { name: "Verify & turn on" }));
    await waitFor(() => expect(onEnabled).toHaveBeenCalledWith("Two-factor authentication is on."));
    expect(verifyMfaSetup).toHaveBeenLastCalledWith("123456");
  });

  it("still asks for all six digits without calling the server", async () => {
    const user = userEvent.setup();
    render(<TotpSetupWizard onEnabled={vi.fn()} onCancel={vi.fn()} />);

    await user.type(await screen.findByLabelText("Verification Code"), "123");
    await user.click(screen.getByRole("button", { name: "Verify & turn on" }));

    expect(screen.getByText("Enter the 6-digit code.")).toBeInTheDocument();
    expect(screen.getByLabelText("Verification Code")).toHaveValue("123");
    expect(verifyMfaSetup).not.toHaveBeenCalled();
  });
});
