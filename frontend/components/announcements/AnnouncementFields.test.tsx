import { render, screen } from "@testing-library/react";
import { pickOption } from "@/components/ui/select.test-utils";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnnouncementCategory } from "@/lib/announcements/announcements-api";
import { splitExpiry } from "@/lib/announcements/expiry";
import { AnnouncementCategoryPicker } from "./AnnouncementCategoryPicker";
import { AnnouncementExpiryField } from "./AnnouncementExpiryField";

// Local Wed 7 Oct 2026, 14:07.
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 9, 7, 14, 7));
});

afterEach(() => {
  vi.useRealTimers();
});

function newUser() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

/** The field is controlled; this holds its value the way the editor does. */
function ExpiryHarness({ initial = null, onValue }: { initial?: string | null; onValue?: (v: string | null) => void }) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <AnnouncementExpiryField
      value={value}
      onChange={(v) => {
        setValue(v);
        onValue?.(v);
      }}
    />
  );
}

describe("AnnouncementCategoryPicker", () => {
  it("shows every category with what it is for, and reports a choice", async () => {
    const onChange = vi.fn();
    function Harness() {
      const [value, setValue] = useState<AnnouncementCategory>("info");
      return (
        <AnnouncementCategoryPicker
          value={value}
          onChange={(c) => {
            setValue(c);
            onChange(c);
          }}
        />
      );
    }
    render(<Harness />);

    // Labelled "Announcement Type", with the four types the push banner names.
    expect(screen.getByRole("group", { name: "Announcement Type" })).toBeInTheDocument();
    for (const label of ["Information", "Update", "Maintenance", "Important"]) {
      expect(screen.getByRole("radio", { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.getByText("Planned downtime or slowness")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Information/ })).toBeChecked();

    await newUser().click(screen.getByText("Maintenance"));

    expect(onChange).toHaveBeenCalledWith("maintenance");
    expect(screen.getByRole("radio", { name: /Maintenance/ })).toBeChecked();
  });
});

describe("AnnouncementExpiryField", () => {
  it("starts at No expiry and says it stays up until unpublished", () => {
    render(<ExpiryHarness />);

    expect(screen.getByRole("radio", { name: "No expiry" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Members see it until you unpublish it.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Expiry time")).not.toBeInTheDocument();
  });

  it("turns a quick choice into a real date and time, and says when it ends", async () => {
    const onValue = vi.fn();
    render(<ExpiryHarness onValue={onValue} />);

    await newUser().click(screen.getByRole("radio", { name: "1 week" }));

    const chosen = onValue.mock.calls.at(-1)?.[0] as string;
    expect(splitExpiry(chosen)).toEqual({ date: "2026-10-14", time: "14:30" });
    expect(screen.getByRole("combobox", { name: "Expiry time" })).toHaveTextContent("14:30");
    expect(screen.getByText(/Members stop seeing it on/)).toHaveTextContent("in 7 days");
  });

  it("picks a day from the calendar, which will not offer a past one", async () => {
    const user = newUser();
    const onValue = vi.fn();
    render(<ExpiryHarness onValue={onValue} />);

    await user.click(screen.getByRole("radio", { name: "Pick a date" }));
    expect(screen.getByRole("dialog", { name: "Pick an expiry date" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "06-Oct-2026" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "20-Oct-2026" }));

    expect(splitExpiry(onValue.mock.calls.at(-1)?.[0] as string)).toEqual({ date: "2026-10-20", time: "18:00" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("warns when the chosen time has already passed", async () => {
    // Today, 18:00 is still ahead; 09:00 is behind.
    render(<ExpiryHarness initial={new Date(2026, 9, 7, 18, 0).toISOString()} />);

    await pickOption(newUser(), "Expiry time", "09:00");

    expect(screen.getByRole("alert")).toHaveTextContent("That time has already passed");
  });

  it("clears back to no expiry", async () => {
    const onValue = vi.fn();
    render(<ExpiryHarness initial={new Date(2026, 9, 9, 18, 0).toISOString()} onValue={onValue} />);

    await newUser().click(screen.getByRole("radio", { name: "No expiry" }));

    expect(onValue).toHaveBeenLastCalledWith(null);
  });
});
