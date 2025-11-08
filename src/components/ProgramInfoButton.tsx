import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { programHistory, programOverview } from "@/domain/programHistory";

const ProgramInfoButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="프로그램 설명"
          className="shrink-0 flex-col gap-1 py-2"
        >
          <Info className="h-4 w-4" />
          <span className="text-xs font-medium">프로그램 설명</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>프로그램 개발 이력</DialogTitle>
          <DialogDescription>
            바이브코딩 프롬프트 기반 진화 과정과 사용자 요청을 한눈에 확인해
            보세요. 모든 프롬프트 요청은 Cursor 크레딧을 차감합니다.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-4">
          <header>
            <h3 className="text-lg font-semibold">{programOverview.serviceName}</h3>
            <p className="text-sm text-muted-foreground">
              {programOverview.introduction}
            </p>
          </header>

          <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">
                서비스 카테고리
              </h4>
              <ul className="space-y-3">
                {programOverview.categories.map((category) => (
                  <li key={category.name} className="rounded-lg bg-muted p-3">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">
                프롬프트 기반 진화 하이라이트
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {programOverview.evolutionHighlights.map((highlight) => (
                  <li key={highlight} className="rounded-md bg-muted p-3">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">버전별 상세 이력</h3>
          <p className="text-sm text-muted-foreground">
            모든 버전은 사용자 프롬프트와 기술적 구현 내역을 기록하여 투명성을
            유지합니다.
          </p>

          <div className="space-y-6">
            {programHistory.map((version) => (
              <article
                key={version.version}
                className="rounded-lg border p-4 shadow-sm"
              >
                <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold">
                      {version.version} · {version.category}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      배포일: {version.releaseDate}
                    </p>
                  </div>
                  <span className="mt-2 inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground sm:mt-0">
                    {version.summary}
                  </span>
                </header>

                <div className="mt-4 space-y-3 text-sm">
                  <section>
                    <h5 className="font-semibold">사용자 프롬프트</h5>
                    <ul className="ml-3 list-disc space-y-1">
                      {version.prompts.map((prompt) => (
                        <li key={prompt}>{prompt}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h5 className="font-semibold">추가된 기능</h5>
                    <ul className="ml-3 list-disc space-y-1">
                      {version.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h5 className="font-semibold">개선사항</h5>
                    <ul className="ml-3 list-disc space-y-1">
                      {version.improvements.map((improvement) => (
                        <li key={improvement}>{improvement}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h5 className="font-semibold">기술적 구현</h5>
                    <ul className="ml-3 list-disc space-y-1">
                      {version.technicalNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              </article>
            ))}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramInfoButton;

