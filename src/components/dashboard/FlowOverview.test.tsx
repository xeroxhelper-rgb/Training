import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FlowOverview from "./FlowOverview";

describe("FlowOverview", () => {
  it("shows the decision flow from workforce data to next training action", () => {
    render(<FlowOverview />);
    expect(screen.getByText("현재 재직자 기준")).toBeInTheDocument();
    expect(screen.getByText("과정 대상 조건")).toBeInTheDocument();
    expect(screen.getByText("수료·미수료 판정")).toBeInTheDocument();
    expect(screen.getByText("다음 차수 후보")).toBeInTheDocument();
  });
});
