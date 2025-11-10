import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, X, Camera, Sparkles } from "lucide-react";
import { Mode } from "@/types";
import {
  getEncouragementMessage,
  saveBrushSession,
  addPoints,
  getTimeOfDay,
} from "@/utils/brushingData";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ARBrushingGuide from "@/components/ARBrushingGuide";
import { useFaceTracking } from "@/hooks/useFaceTracking";
import { useBrushingAnalysis } from "@/hooks/useBrushingAnalysis";

interface BrushingTimerProps {
  mode: Mode;
  onComplete: () => void;
  onCancel: () => void;
}

const TOTAL_SECONDS = 180; // 3 minutes
const POINTS_PER_SESSION = 10;

// Background music for each mode (royalty-free sources from Pixabay)
// All music is licensed under Pixabay Content License (free for commercial use, no attribution required)
const BACKGROUND_MUSIC = {
  kids: [
    "https://cdn.pixabay.com/audio/2022/03/10/audio_4a456a6ff4.mp3", // Happy Kids Music
    "https://cdn.pixabay.com/audio/2022/08/02/audio_95c2c2240d.mp3", // Playful Children
    "https://cdn.pixabay.com/audio/2023/03/24/audio_9e4b861ae0.mp3", // Fun Kids Song
  ],
  learning: [
    "https://cdn.pixabay.com/audio/2022/03/24/audio_c3bc5d30dd.mp3", // Lofi Study Beat
    "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3", // Calm Focus Music
    "https://cdn.pixabay.com/audio/2022/08/23/audio_80c38374fe.mp3", // Peaceful Study
  ],
  normal: [] as string[], // No background music for normal mode
};

// Kids mode: Fun tooth brushing songs and animations
const buildYouTubeEmbedUrl = (id: string) =>
  `https://www.youtube.com/embed/${id}`;

type VideoSource =
  | {
      type: "youtube";
      id: string;
      title: string;
      description?: string;
      attribution?: string;
    }
  | {
      type: "mp4";
      src: string;
      title: string;
      description?: string;
      attribution?: string;
      poster?: string;
    };

const kidsVideos: VideoSource[] = [
  {
    type: "mp4",
    src: "https://cdn.coverr.co/videos/coverr-brushing-teeth-people-with-each-other-5299/1080p.mp4",
    title: "함께 이를 닦는 어린이",
    description: "아이와 보호자가 함께 이를 닦는 생활 습관 영상",
    attribution: "Coverr · CC0",
  },
  {
    type: "mp4",
    src: "https://cdn.coverr.co/videos/coverr-little-girl-brushing-her-teeth-6721/1080p.mp4",
    title: "거울 앞에서 양치하는 아이",
    description: "거울을 보며 양치하는 아이의 4K 영상",
    attribution: "Coverr · CC0",
  },
  {
    type: "mp4",
    src: "https://assets.mixkit.co/videos/preview/mixkit-kid-brushing-his-teeth-in-the-morning-28290-large.mp4",
    title: "아침 양치 루틴",
    description: "밝은 아침 분위기의 양치 장면",
    attribution: "Mixkit · Free License",
  },
];

const learningVideos: VideoSource[] = [
  {
    type: "mp4",
    src: "https://cdn.coverr.co/videos/coverr-young-woman-studying-while-listening-to-music-5670/1080p.mp4",
    title: "집중 공부 타임",
    description: "잔잔한 음악과 함께 공부하는 학습 분위기 영상",
    attribution: "Coverr · CC0",
  },
  {
    type: "mp4",
    src: "https://assets.mixkit.co/videos/preview/mixkit-students-studying-together-1150-large.mp4",
    title: "함께 공부하는 친구들",
    description: "학습에 집중하는 학생들의 장면",
    attribution: "Mixkit · Free License",
  },
  {
    type: "youtube",
    id: "5qap5aO4i9A",
    title: "Lofi Girl 집중 음악",
    description: "저작권 없는 학습용 배경 음악 스트림",
    attribution: "YouTube · Lofi Girl",
  },
];

const PlaceholderContent = ({ mode, title }: { mode: Mode; title: string }) => {
  const animations: Record<Mode, string> = {
    kids: "animate-bounce",
    learning: "animate-pulse",
    normal: "animate-pulse",
  };

  const icons: Record<Mode, string> = {
    kids: "🦷✨🪥",
    learning: "📚💡✍️",
    normal: "🌟💪⏰",
  };

  const messages: Record<Mode, string> = {
    kids: "치카치카! 깨끗한 이를 만들어요",
    learning: "집중해서 학습하는 시간입니다",
    normal: "건강한 습관을 만들어가요",
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="p-8 text-center">
        <div className={`mb-6 text-6xl ${animations[mode]}`}>{icons[mode]}</div>
        <h3 className="mb-3 text-xl font-semibold text-gray-800">{title}</h3>
        <p className="mb-4 text-sm text-gray-600">{messages[mode]}</p>
        <div className="mx-auto h-1 w-32 rounded-full bg-gradient-to-r from-blue-400 to-green-400" />
      </div>
    </div>
  );
};

const normalVideos: VideoSource[] = [
  {
    type: "youtube",
    id: "bk7McNUjWgw",
    title: "3분 건강 뉴스",
    description: "하루 3분 건강 정보를 전달하는 클립",
    attribution: "YouTube",
  },
  {
    type: "youtube",
    id: "ZSt9tm3RoUU",
    title: "TED-Ed 3분 과학",
    description: "짧은 과학 지식을 전달하는 TED-Ed 영상",
    attribution: "YouTube",
  },
  {
    type: "youtube",
    id: "HEYbgyL5n1g",
    title: "3분 자연 다큐",
    description: "편안한 자연 풍경을 담은 짧은 다큐",
    attribution: "YouTube",
  },
  {
    type: "youtube",
    id: "1ZYbU82GVz4",
    title: "건강한 생활 습관",
    description: "건강 루틴을 소개하는 인포 클립",
    attribution: "YouTube",
  },
  {
    type: "youtube",
    id: "sTJ7AzBIJoI",
    title: "3분 시사 요약",
    description: "바쁜 일정을 위한 짧은 시사 요약",
    attribution: "YouTube",
  },
];

const kidsContent = [
  "🦷 이가 깨끗해지고 있어요!",
  "🌟 반짝반짝 빛나는 이!",
  "🎵 치카치카 신나는 노래!",
  "🦸 양치 히어로가 되어가요!",
  "💎 보물같은 하얀 이!",
  "🌈 무지개처럼 환한 미소!",
];

const normalContent = [
  "올바른 양치 방법: 칫솔모를 45도 각도로 잡아주세요",
  "치아 표면뿐만 아니라 잇몸 경계선도 부드럽게 닦아주세요",
  "안쪽 면도 꼼꼼히 닦는 것이 중요합니다",
  "혀도 부드럽게 닦아 구취를 예방하세요",
  "하루 3번, 식후 3분 이내, 3분 동안이 기본입니다",
  "정기적인 치과 검진도 잊지 마세요",
];

const learningQuotes = [
  {
    english: "The future depends on what you do today.",
    korean: "미래는 당신이 오늘 무엇을 하느냐에 달려 있다.",
    author: "Mahatma Gandhi",
  },
  {
    english: "Success is the sum of small efforts, repeated day in and day out.",
    korean: "성공은 반복되는 작은 노력들의 합이다.",
    author: "Robert Collier",
  },
  {
    english: "Learning is a treasure that will follow its owner everywhere.",
    korean: "배움은 주인을 평생 따라다니는 보물이다.",
    author: "Chinese Proverb",
  },
  {
    english: "Dream big and dare to fail.",
    korean: "크게 꿈꾸고 도전하라.",
    author: "Norman Vaughan",
  },
];

const learningSentences = [
  {
    english: "Every day is a new chance to smile brighter.",
    korean: "매일은 더 환하게 웃을 새로운 기회다.",
    tip: "미소와 함께 자신감을 높여요.",
  },
  {
    english: "Healthy habits start with one mindful moment.",
    korean: "건강한 습관은 한 번의 의식적인 순간에서 시작된다.",
    tip: "타이머와 함께 집중해 보세요.",
  },
  {
    english: "I celebrate small wins to reach big goals.",
    korean: "나는 작은 성취를 축하하며 큰 목표에 다가간다.",
    tip: "양치 후 성취감을 기록해 보세요.",
  },
  {
    english: "Consistency turns routines into results.",
    korean: "지속성이 루틴을 결과로 바꾼다.",
    tip: "매일 같은 시간에 연습해 보세요.",
  },
];

const BrushingTimer = ({ mode, onComplete, onCancel }: BrushingTimerProps) => {
  const normalizedMode = useMemo<Mode>(() => {
    return ((mode as string) === "study" ? "learning" : mode) as Mode;
  }, [mode]);
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [contentIndex, setContentIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const { toast } = useToast();
  const isLearningMode = normalizedMode === "learning";
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [useSelfieMode, setUseSelfieMode] = useState(false);
  const [useARMode, setUseARMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentZone, setCurrentZone] = useState(0);

  // AR 기능: 얼굴 추적 및 양치 동작 분석
  const { landmarks, isLoading: isFaceTrackingLoading } = useFaceTracking(
    cameraVideoRef,
    normalizedMode === "kids" && useSelfieMode && useARMode,
    {
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    }
  );

  const { score: arScore, feedback: arFeedback, isCorrectMotion } = useBrushingAnalysis(
    landmarks,
    currentZone,
    normalizedMode === "kids" && useSelfieMode && useARMode && isRunning
  );

  // Select random background music for kids and learning modes
  const backgroundMusicUrl = useMemo(() => {
    const musicList = BACKGROUND_MUSIC[normalizedMode];
    if (!musicList || musicList.length === 0) return null;
    return musicList[Math.floor(Math.random() * musicList.length)];
  }, [normalizedMode]);

  // Select random video on component mount
  const videoSource = useMemo(() => {
    const list =
      normalizedMode === "kids"
        ? kidsVideos
        : normalizedMode === "learning"
        ? learningVideos
        : normalVideos;
    return list[Math.floor(Math.random() * list.length)];
  }, [normalizedMode]);

  useEffect(() => {
    setVideoError(false);
    setVideoLoading(true);
  }, [videoSource]);

  const stopCameraStream = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (normalizedMode !== "kids") {
      setUseSelfieMode(false);
      setUseARMode(false);
      setCameraError(null);
      stopCameraStream();
    }
  }, [normalizedMode, stopCameraStream]);

  // 구역 변경 로직 (45초마다)
  useEffect(() => {
    if (!isRunning || !useARMode) return;
    
    const elapsed = TOTAL_SECONDS - seconds;
    const zoneIndex = Math.floor(elapsed / 45);
    
    if (zoneIndex !== currentZone && zoneIndex < 4) {
      setCurrentZone(zoneIndex);
    }
  }, [seconds, isRunning, useARMode, currentZone]);

  // Background music initialization and control
  useEffect(() => {
    if (!backgroundMusicUrl) return;

    // Create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio(backgroundMusicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3; // Set volume to 30%
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [backgroundMusicUrl]);

  // Control background music based on timer state
  useEffect(() => {
    if (!audioRef.current || !backgroundMusicUrl) return;

    if (isRunning) {
      // Play music when timer starts
      audioRef.current.play().catch((error) => {
        console.warn("배경 음악 자동 재생이 차단되었습니다:", error);
        // Fallback: User interaction required for autoplay
      });
    } else {
      // Pause music when timer stops
      audioRef.current.pause();
    }
  }, [isRunning, backgroundMusicUrl]);

  useEffect(() => {
    if (!(normalizedMode === "kids" && useSelfieMode)) {
      stopCameraStream();
      return;
    }

    setCameraError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("카메라를 지원하지 않는 환경입니다.");
      return;
    }

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        cameraStreamRef.current = stream;
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch((error) => {
            console.warn("카메라 재생이 차단되었습니다:", error);
          });
        }
      })
      .catch((error) => {
        console.warn("카메라 접근 실패:", error);
        setCameraError("카메라 접근 권한을 허용해 주세요.");
        setUseSelfieMode(false);
      });

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [normalizedMode, stopCameraStream, useSelfieMode]);

  const content = useMemo(() => {
    if (normalizedMode === "kids") return kidsContent;
    if (normalizedMode === "normal") return normalContent;
    return [];
  }, [normalizedMode]);
  const hasRotatingContent = content.length > 0;

  const learningMaterial = useMemo(() => {
    if (!isLearningMode) return null;
    const quote =
      learningQuotes[Math.floor(Math.random() * learningQuotes.length)];
    const sentence =
      learningSentences[Math.floor(Math.random() * learningSentences.length)];
    return { quote, sentence };
  }, [isLearningMode]);

  const progress = ((TOTAL_SECONDS - seconds) / TOTAL_SECONDS) * 100;

  const handleComplete = useCallback(() => {
    // Stop background music
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // AR 모드 사용 시 보너스 점수 계산
    const bonusPoints = useARMode && arScore > 50 ? Math.floor(arScore / 10) : 0;
    const totalPoints = POINTS_PER_SESSION + bonusPoints;

    const session = {
      id: Date.now().toString(),
      date: new Date(),
      time: getTimeOfDay(),
      completed: true,
      duration: TOTAL_SECONDS,
      points: totalPoints,
    };

    saveBrushSession(session);
    addPoints(totalPoints);

    toast({
      title: getEncouragementMessage(normalizedMode, true),
      description: useARMode 
        ? `${totalPoints} 포인트를 획득했어요! (AR 보너스: +${bonusPoints}점 🌟)` 
        : `${totalPoints} 포인트를 획득했어요!`,
    });

    onComplete();
  }, [normalizedMode, toast, onComplete, useARMode, arScore]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, seconds, handleComplete]);

  useEffect(() => {
    if (!hasRotatingContent) {
      setContentIndex(0);
      return;
    }
    const contentInterval = setInterval(() => {
      setContentIndex((prev) => (prev + 1) % content.length);
    }, 5000);

    return () => clearInterval(contentInterval);
  }, [content.length, hasRotatingContent]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    console.log("타이머 시작, 현재 비디오 소스:", videoSource);
    setIsRunning(true);
    if (videoSource?.type === "mp4" && videoElementRef.current) {
      const video = videoElementRef.current;
      video.muted = true;
      console.log("비디오 요소 상태:", {
        readyState: video.readyState,
        networkState: video.networkState,
        currentSrc: video.currentSrc,
      });

      video
        .play()
        .then(() => console.log("비디오 재생 성공"))
        .catch((error) => {
          console.warn("자동재생이 차단되었습니다:", error);
        });
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    if (videoSource?.type === "mp4" && videoElementRef.current) {
      videoElementRef.current.pause();
    }
  };

  const handleCancel = () => {
    // Stop background music
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onCancel();
  };

  const buttonAppearance: Record<
    Mode,
    {
      variant: "default" | "outline" | "ghost" | "kids";
      className: string;
    }
  > = {
    kids: {
      variant: "kids",
      className: "min-w-32 bg-accent text-accent-foreground hover:opacity-90",
    },
    learning: {
      variant: "outline",
      className: "min-w-32 bg-secondary text-secondary-foreground hover:opacity-90",
    },
    normal: {
      variant: "outline",
      className: "min-w-32 bg-primary text-primary-foreground hover:opacity-90",
    },
  };
  const pauseButtonClass = {
    kids: "min-w-32 border-accent/20 hover:bg-accent/10 text-accent",
    learning: "min-w-32 border-secondary/20 hover:bg-secondary/10 text-secondary",
    normal: "min-w-32 border-primary/20 hover:bg-primary/10 text-primary",
  } as const;
  const contentCardClass: Record<Mode, string> = {
    kids: "bg-accent/5 border-accent/10",
    learning: "bg-secondary/5 border-secondary/10",
    normal: "bg-primary/5 border-primary/10",
  };
  const learningCardClass = {
    quote: "bg-secondary/5 border-secondary/10",
    sentence: "bg-secondary/10 border-secondary/20",
  };
  const timerTitle = isLearningMode ? "학습 타이머" : "양치 타이머";

  const renderVideoPlayer = () => {
    if (videoError || !videoSource) {
      return (
        <PlaceholderContent
          mode={normalizedMode}
          title={videoSource?.title ?? "양치 가이드"}
        />
      );
    }

    if (videoSource.type === "youtube") {
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            key={videoSource.id}
            src={`${buildYouTubeEmbedUrl(videoSource.id)}?autoplay=${isRunning ? 1 : 0}&mute=1&controls=1&rel=0&modestbranding=1&playsinline=1`}
            title={videoSource.title}
            aria-label={normalizedMode === "kids" ? "아이들을 위한 양치 영상" : "양치/학습 영상"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onLoad={() => setVideoLoading(false)}
            onError={() => {
              console.warn("YouTube iframe 로딩 실패");
              setVideoLoading(false);
              setVideoError(true);
            }}
          />
          {videoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <video
          key={videoSource.src}
          ref={videoElementRef}
          controls
          playsInline
          preload="metadata"
          muted
          poster={videoSource.poster}
          className="h-full w-full object-cover"
          aria-label={videoSource.title}
          onLoadStart={() => setVideoLoading(true)}
          onCanPlay={() => setVideoLoading(false)}
          onError={() => {
            console.warn("비디오 로딩 실패:", videoSource.src);
            setVideoLoading(false);
            setVideoError(true);
          }}
        >
          <source src={videoSource.src} type="video/mp4" />
        </video>
        {videoLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
          </div>
        )}
      </div>
    );
  };

  const renderVideoMeta = () => {
    if (!videoSource || videoError || (normalizedMode === "kids" && useSelfieMode)) return null;
    return (
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <span className="text-sm font-medium text-foreground">
          {videoSource.title}
        </span>
        {videoSource.description && <span>{videoSource.description}</span>}
        {videoSource.attribution && <span>출처: {videoSource.attribution}</span>}
      </div>
    );
  };

  const renderKidsCamera = () => {
    return (
      <div className="space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
          <video
            ref={cameraVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover transform scale-x-[-1]"
          />
          {useARMode && (
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
            />
          )}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <Card className="max-w-xs p-4 text-center text-sm text-foreground">
                <p>{cameraError}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  브라우저 설정에서 카메라 권한을 허용한 뒤 다시 시도해 주세요.
                </p>
              </Card>
            </div>
          )}
          {useARMode && isFaceTrackingLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Card className="p-4 text-center text-sm text-white">
                <div className="h-8 w-8 mx-auto mb-2 animate-spin rounded-full border-b-2 border-white" />
                <p>AR 가이드 준비 중...</p>
              </Card>
            </div>
          )}
        </div>
        
        {/* AR 모드 토글 버튼 */}
        <div className="flex justify-center">
          <Button
            type="button"
            size="sm"
            variant={useARMode ? "default" : "outline"}
            onClick={() => setUseARMode((prev) => !prev)}
            className="inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {useARMode ? "AR 가이드 켜짐 ✨" : "AR 가이드 켜기"}
          </Button>
        </div>

        {!cameraError && (
          <Card className={cn(
            "border p-4 text-center text-sm text-foreground transition-all",
            useARMode 
              ? "border-accent/50 bg-accent/20" 
              : "border-accent/30 bg-accent/10"
          )}>
            {useARMode ? (
              <div>
                <p className="font-semibold text-accent mb-2">{arFeedback}</p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="text-xs">
                    <span className="text-muted-foreground">점수:</span>{' '}
                    <span className="font-bold text-accent">{arScore}점</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">동작:</span>{' '}
                    <span className={cn(
                      "font-bold",
                      isCorrectMotion ? "text-green-600" : "text-orange-600"
                    )}>
                      {isCorrectMotion ? "좋아요! 🎉" : "조금 더! 💪"}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  AR 가이드를 따라 입을 크게 벌리고 양치 동작을 해보세요!
                </p>
              </div>
            ) : (
              <div>
                <p>카메라를 보며 입을 크게 벌리고 좌우로 움직이며 양치 동작을 따라 해보세요!</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  화면을 통해 올바른 방향으로 칫솔질하는 모습을 스스로 확인할 수 있어요.
                </p>
                <p className="mt-2 text-xs font-semibold text-accent">
                  💡 AR 가이드를 켜면 실시간으로 양치 방향을 안내받을 수 있어요!
                </p>
              </div>
            )}
          </Card>
        )}

        {/* AR 가이드 렌더링 */}
        {useARMode && canvasRef.current && (
          <ARBrushingGuide
            landmarks={landmarks}
            canvasRef={canvasRef}
            currentZone={currentZone}
            timeLeft={seconds}
            isCorrectMotion={isCorrectMotion}
          />
        )}
      </div>
    );
  };

  const renderMainContent = () => {
    if (normalizedMode === "kids" && useSelfieMode) {
      return renderKidsCamera();
    }

    return (
      <div className="space-y-3">
        {renderVideoPlayer()}
        {renderVideoMeta()}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <Card className="w-full max-w-4xl p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{timerTitle}</h2>
            {normalizedMode === "kids" && (
              <Button
                type="button"
                size="sm"
                variant={useSelfieMode ? "secondary" : "outline"}
                onClick={() => setUseSelfieMode((prev) => !prev)}
                className="inline-flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {useSelfieMode ? "영상 보기" : "카메라"}
              </Button>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Mode-specific primary content */}
          {isLearningMode ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className={cn("p-4", learningCardClass.quote)}>
                <h3 className="text-sm font-semibold text-muted-foreground">
                  명언 영어
                </h3>
                <p className="mt-2 text-lg font-bold text-foreground">
                  “{learningMaterial?.quote.english}”
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {learningMaterial?.quote.korean}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  — {learningMaterial?.quote.author}
                </p>
              </Card>
              <Card className={cn("p-4", learningCardClass.sentence)}>
                <h3 className="text-sm font-semibold text-muted-foreground">
                  오늘의 영어 한문장
                </h3>
                <p className="mt-2 text-lg font-bold text-primary">
                  {learningMaterial?.sentence.english}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {learningMaterial?.sentence.korean}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Tip: {learningMaterial?.sentence.tip}
                </p>
              </Card>
              <Card className="md:col-span-2 border border-[#bae6fd] bg-[#e0f2fe] p-4">
                <h3 className="text-sm font-semibold text-[#1d4ed8]">
                  학습 영상 & 배경 음악
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  저작권 걱정 없이 사용할 수 있는 학습용 영상을 자동으로 불러옵니다.
                </p>
                <div className="mt-3 space-y-3">
                  {renderMainContent()}
                </div>
              </Card>
            </div>
          ) : (
            renderMainContent()
          )}

          {/* Timer Display */}
          <div className="text-center">
            <div className="mb-3 text-5xl font-bold md:text-6xl">
              {formatTime(seconds)}
            </div>
            <Progress value={progress} className="mb-2 h-3" />
            <p className="text-sm text-muted-foreground">
              {Math.round(progress)}% 완료
            </p>
          </div>

          {/* Motivational / Learning Content */}
          {hasRotatingContent ? (
            <Card
              className={cn(
                "p-4 text-center",
                contentCardClass[normalizedMode],
              )}
            >
              <p className="text-sm">{content[contentIndex]}</p>
            </Card>
          ) : (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">
                타이머와 함께 문장을 소리 내어 읽고, 종료 후에는 다시 한 번
                반복하며 기억을 강화해 보세요.
              </p>
            </Card>
          )}

          {/* Control Buttons */}
          <div className="flex justify-center gap-3">
            {!isRunning ? (
              <Button
                variant={buttonAppearance[normalizedMode].variant}
                onClick={handleStart}
                className={buttonAppearance[normalizedMode].className}
              >
                <Play className="mr-2 h-4 w-4" />
                시작
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handlePause}
                className={pauseButtonClass[normalizedMode]}
              >
                <Pause className="mr-2 h-4 w-4" />
                일시정지
              </Button>
            )}
          </div>

          {/* Final Encouragement */}
          {seconds < 60 && seconds > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {getEncouragementMessage(normalizedMode, false)}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BrushingTimer;
