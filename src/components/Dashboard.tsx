import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy } from "lucide-react";
import { Mode } from "@/types";
import {
  getTodaySessions,
  getTotalPoints,
  getTimeOfDay,
} from "@/utils/brushingData";
import WeeklyCalendar from "./WeeklyCalendar";
import ProgramInfoButton from "./ProgramInfoButton";
import { cn } from "@/lib/utils";

interface DashboardProps {
  mode: Mode;
  onStartBrushing: () => void;
  onSwitchMode: (mode: Mode) => void;
}

const Dashboard = ({ mode, onStartBrushing, onSwitchMode }: DashboardProps) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const todaySessions = getTodaySessions();
  const totalPoints = getTotalPoints();
  const timeOfDay = getTimeOfDay();

  const hasCompletedSession = (time: "morning" | "afternoon" | "evening") => {
    return todaySessions.some(s => s.time === time && s.completed);
  };

  const completedCount = todaySessions.filter(s => s.completed).length;
  const sessionOrder: Array<{ label: string; time: "morning" | "afternoon" | "evening" }> = [
    { label: "아침", time: "morning" },
    { label: "점심", time: "afternoon" },
    { label: "저녁", time: "evening" },
  ];

  const sessionStatuses = sessionOrder.map((entry) => {
    const session = todaySessions.find((s) => s.time === entry.time);
    return {
      ...entry,
      completed: Boolean(session?.completed),
    };
  });
  const primaryButtonClass: Record<Mode, string> = {
    kids: "bg-accent text-accent-foreground hover:opacity-90 transition-opacity",
    learning: "bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity",
    normal: "bg-primary text-primary-foreground hover:opacity-90 transition-opacity",
  };
  const modeLabel: Record<Mode, string> = {
    kids: "키즈 모드",
    learning: "학습 모드",
    normal: "일반 모드",
  };
  const modeSubtitle: Record<Mode, string> = {
    kids: "재미있게 양치하고 습관을 만들어 보세요.",
    learning: "오늘의 영어 문장을 타이머와 함께 외워보세요.",
    normal: "균형 잡힌 양치 루틴으로 건강을 지켜요.",
  };
  const modeOptions = useMemo(
    () =>
      [
        {
          value: "kids" as Mode,
          label: "키즈 모드",
          description: "놀이형 콘텐츠와 응원 메시지",
        },
        {
          value: "learning" as Mode,
          label: "학습 모드",
          description: "명언 영어 · 오늘의 영어 한문장",
        },
        {
          value: "normal" as Mode,
          label: "일반 모드",
          description: "건강 정보와 루틴 관리",
        },
      ] as const,
    [],
  );
  const modeButtonStyles: Record<
    Mode,
    { active: string; inactive: string; accent: string }
  > = {
    kids: {
      active: "bg-accent text-accent-foreground",
      inactive: "border-accent/20 hover:bg-accent/10 text-accent",
      accent: "text-accent/70",
    },
    learning: {
      active: "bg-secondary text-secondary-foreground",
      inactive: "border-secondary/20 hover:bg-secondary/10 text-secondary",
      accent: "text-secondary/70",
    },
    normal: {
      active: "bg-primary text-primary-foreground",
      inactive: "border-primary/20 hover:bg-primary/10 text-primary",
      accent: "text-primary/70",
    },
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">Chika Chika</h1>
              <ProgramInfoButton />
            </div>
            <p className="text-base text-muted-foreground">
              {modeLabel[mode]}
            </p>
            <p className="text-sm text-muted-foreground">
              {modeSubtitle[mode]}
            </p>
          </div>
          <div className="flex flex-col gap-2 self-stretch sm:items-end">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              모드 전환
            </span>
            <div className="flex flex-wrap gap-2">
              {modeOptions.map((option) => {
                const isActive = option.value === mode;
                const styles = modeButtonStyles[option.value];
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!isActive) {
                        onSwitchMode(option.value);
                      }
                    }}
                    disabled={isActive}
                    aria-pressed={isActive}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-all",
                      isActive ? styles.active : styles.inactive,
                    )}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">총 포인트</p>
                <p className="mt-2 text-3xl font-bold">{totalPoints}</p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">오늘의 양치</p>
                  <p className="mt-2 text-3xl font-bold">
                    {completedCount}
                    <span className="text-lg text-muted-foreground">/3</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {sessionStatuses.map(({ time, completed }) => (
                    <div
                      key={time}
                      className={cn(
                        "h-3 w-3 rounded-full transition-colors",
                        completed ? "bg-success" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {sessionStatuses.map(({ label, time, completed }) => (
                  <div
                    key={time}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-center transition-colors",
                      completed
                        ? "border-success/30 bg-success/10 text-foreground"
                        : "border-muted bg-muted text-muted-foreground"
                    )}
                  >
                    <p className="text-sm font-medium">{label}</p>
                    <span
                      className={cn(
                        "mt-1 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold",
                        completed
                          ? "bg-success text-white"
                          : "bg-muted-foreground/10 text-muted-foreground"
                      )}
                    >
                      {completed ? "완료" : "미완료"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            size="lg"
            className={cn(
              "w-full h-14 text-base font-medium transition-opacity",
              primaryButtonClass[mode],
            )}
            onClick={onStartBrushing}
          >
            지금 양치하기
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {showCalendar ? "캘린더 닫기" : "주간 기록 보기"}
          </Button>
        </div>

        {/* Weekly Calendar */}
        {showCalendar && <WeeklyCalendar mode={mode} />}
      </div>
    </div>
  );
};

export default Dashboard;
