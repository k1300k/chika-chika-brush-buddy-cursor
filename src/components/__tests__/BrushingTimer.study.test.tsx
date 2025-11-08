import { render, screen } from "@testing-library/react";
import BrushingTimer from "../BrushingTimer";
import type { Mode } from "@/types";

describe("BrushingTimer - 학습 모드", () => {
  const noop = () => {};

  it("오늘의 영어 한문장 섹션과 학습 전용 타이머를 보여준다", () => {
    render(
      <BrushingTimer
        mode={"study" as Mode}
        onComplete={noop}
        onCancel={noop}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /학습 타이머/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/오늘의 영어 한문장/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/명언 영어/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/학습 영상 & 배경 음악/i),
    ).toBeInTheDocument();
  });
});

