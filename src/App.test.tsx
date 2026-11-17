// @vitest-environment jsdom
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import App from "./App";
beforeEach(() => {
  localStorage.clear();
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: true,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
afterEach(cleanup);
it("requires review decisions before marking a scope ready", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Try an example/i }));
  fireEvent.click(
    await screen.findByRole("button", { name: /Create my scope/i }),
  );
  await screen.findByLabelText("PROJECT SUMMARY");
  expect(
    (
      screen.getByRole("button", {
        name: /Mark ready for review/,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Deliverables" }));
  const checks = await screen.findAllByRole("checkbox", {
    name: /Reviewed by me/,
  });
  checks.forEach((c) => fireEvent.click(c));
  fireEvent.click(screen.getByRole("button", { name: /^Questions/ }));
  const answers = await screen.findAllByLabelText(/^Answer to question/);
  answers.forEach((a) =>
    fireEvent.change(a, {
      target: { value: "Confirmed in the client conversation." },
    }),
  );
  const mark = screen.getByRole("button", {
    name: /Mark ready for review/,
  }) as HTMLButtonElement;
  expect(mark.disabled).toBe(false);
  fireEvent.click(mark);
  expect(screen.getByText("Ready for client review")).toBeTruthy();
});
it("creates a scope from a starter, edits its summary, and renders a preview", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Try an example/i }));
  await screen.findByRole("button", { name: /Create my scope/i });
  fireEvent.click(screen.getByRole("button", { name: /Create my scope/i }));
  await screen.findByLabelText("PROJECT SUMMARY");
  fireEvent.change(screen.getByLabelText("PROJECT SUMMARY"), {
    target: { value: "A revised studio website scope." },
  });
  fireEvent.click(screen.getByRole("tab", { name: /Preview & export/i }));
  await screen.findByText("A revised studio website scope.");
  expect(screen.getByRole("heading", { name: "Studio website" })).toBeTruthy();
  const stored = JSON.parse(localStorage.getItem("clientscope:workspace:v1")!);
  expect(stored.documents[0].scope.summary).toBe(
    "A revised studio website scope.",
  );
});
it("persists the selected light theme and restores saved drafts after remount", async () => {
  const { unmount } = render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Light" }));
  expect(document.documentElement.dataset.theme).toBe("light");
  fireEvent.click(
    screen.getByRole("button", { name: /Create your first draft/i }),
  );
  await screen.findByLabelText("Project title");
  fireEvent.change(screen.getByLabelText("Project title"), {
    target: { value: "Saved project" },
  });
  unmount();
  render(<App />);
  await waitFor(() =>
    expect(screen.getAllByText("Saved project").length).toBeGreaterThan(0),
  );
  expect(localStorage.getItem("clientscope:theme")).toBe("light");
});
it("keeps generation disabled for an insufficient brief and exposes the guide dialog", async () => {
  render(<App />);
  fireEvent.click(
    screen.getByRole("button", { name: /Create your first draft/i }),
  );
  const button = await screen.findByRole("button", {
    name: /Create my scope/i,
  });
  expect((button as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Open workspace guide" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
