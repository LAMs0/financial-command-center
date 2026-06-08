// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeleteCardButton from "@/components/cards/DeleteCardButton";
import { deleteCard } from "@/lib/actions/cards";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/actions/cards", () => ({
  deleteCard: vi.fn(),
}));

describe("DeleteCardButton", () => {
  beforeEach(() => {
    vi.mocked(deleteCard).mockReset();
    refresh.mockReset();
  });

  it("asks for confirmation before deleting a card", async () => {
    const user = userEvent.setup();

    render(<DeleteCardButton cardId="card_1" cardName="Visa Platinum" locale="es" />);

    await user.click(screen.getByRole("button", { name: /Eliminar tarjeta: Visa Platinum/i }));

    expect(screen.getByText(/permanente/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Si, eliminar|Sí, eliminar/i })).toBeInTheDocument();
    expect(deleteCard).not.toHaveBeenCalled();
  });

  it("runs the delete action and refreshes after confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteCard).mockResolvedValue({});

    render(<DeleteCardButton cardId="card_1" cardName="Visa Platinum" locale="es" />);

    await user.click(screen.getByRole("button", { name: /Eliminar tarjeta: Visa Platinum/i }));
    await user.click(screen.getByRole("button", { name: /Si, eliminar|Sí, eliminar/i }));

    await waitFor(() => expect(deleteCard).toHaveBeenCalledWith("card_1"));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
});
