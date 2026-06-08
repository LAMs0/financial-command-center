// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConnectBank from "@/components/banking/ConnectBank";
import { connectInstitution, disconnectInstitution } from "@/lib/actions/banking";

vi.mock("@/lib/actions/banking", () => ({
  connectInstitution: vi.fn(),
  disconnectInstitution: vi.fn(),
  resyncInstitution: vi.fn(),
}));

describe("ConnectBank", () => {
  beforeEach(() => {
    vi.mocked(connectInstitution).mockReset();
    vi.mocked(disconnectInstitution).mockReset();
  });

  it("connects an available institution in direct mode", async () => {
    const user = userEvent.setup();
    vi.mocked(connectInstitution).mockResolvedValue({ connected: "Chase" });

    render(
      <ConnectBank
        connected={[]}
        institutions={[
          { id: "chase", name: "Chase", country: "US", color: "#0ea5e9" },
        ]}
        mode="direct"
        providerId="mock"
      />,
    );

    await user.click(screen.getByRole("button", { name: /Chase/i }));

    await waitFor(() => expect(connectInstitution).toHaveBeenCalledWith("chase"));
  });

  it("disconnects an already connected institution", async () => {
    const user = userEvent.setup();
    vi.mocked(disconnectInstitution).mockResolvedValue({});

    render(
      <ConnectBank
        connected={[
          { name: "Chase", color: "#0ea5e9", accountCount: 2 },
        ]}
        institutions={[
          { id: "chase", name: "Chase", country: "US", color: "#0ea5e9" },
        ]}
        mode="direct"
        providerId="mock"
      />,
    );

    await user.click(screen.getByRole("button", { name: /Desconectar Chase/i }));

    await waitFor(() => expect(disconnectInstitution).toHaveBeenCalledWith("Chase"));
  });
});
