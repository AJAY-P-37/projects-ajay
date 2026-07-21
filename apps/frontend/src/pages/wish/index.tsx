import { useEffect, useMemo, useState, useRef } from "react";
import biggestGiftImage from "./BIggest Gift.jpeg";

const celebrationOptions = [
  "N4 beach (Early Morning date)",
  "Roof Top Restaurant (Late Night Rounds Date)",
];
const storageKey = "love-day-choice";
const puzzlePieces = ["🎂", "✨", "💙", "🌙", "💌", "🎉"];
const letterKey = "letter-unlocked";
const puzzleSolvedKey = "puzzle-solved";
const puzzlePieceKey = "revealed-puzzle-piece";
const LetterContent = ({ onGiftClick }: { onGiftClick: (e: React.MouseEvent) => void }) => (
  <>
    <p>🎂✨ Happy 25th Birthday to My Forever Person 💙♾️</p>

    <p>I still remember when we first saw each other.</p>

    <p>
      You were sitting on the last bench during the PDC camp session, and I was in the first row
      coordinating everything. 😂 It was such a laughter-filled session. I turned around to look at
      everyone, and there you were, smiling, or maybe laughing 😄 at me.
    </p>

    <p>
      I hardly spoke to anyone other than for coordination. But somehow, it was different with you.
      💙
    </p>

    <p>
      I often wonder what impact that PDC camp had on my life. Keeping the personality development
      aside, what did it really give me personally or socially? A few friends, maybe.
    </p>

    <p>Turns out, it gave me the best girl anyone could ever ask for. 🥹💙</p>

    <p>
      Ever since our college days, I've always wondered how different your personality is. You're
      someone who cares so deeply that you even cry for people who disrespect you or take you for
      granted. 🥺
    </p>

    <p>
      Even though I've been harsh with you a few times, I've always had this feeling of not wanting
      to hurt you. Yet, despite that, I've ended up hurting you many times. I'm truly sorry. ❤️
    </p>

    <p>Such a cutie, such a precious soul. 🫂✨</p>

    <p>
      I've never hesitated to share things with you, especially things that could make us jealous.
      You've always been my biggest well-wisher. ❤️
    </p>

    <p>I've shared many things with you that even some of my closest friends don't know.</p>

    <p>
      But one thing I always found difficult to share was about the people around me, my friends and
      family, because you get possessive. 😂
    </p>

    <p>And honestly, I like that you're possessive rather than jealous. ❤️</p>

    <p>
      In the early days, I often avoided talking much about them because I knew you'd get too
      involved. 😂 Looking back now, maybe all of that happened for a reason, and it has only
      brought us to where we are today. 😌💙
    </p>

    <p>I really love the way you stand up for what's right with so much courage. ❤️</p>

    <p>I love the way you speak and take care of people whenever someone needs help. 🤍</p>

    <p>
      I absolutely adore the transition between the angry little sparrow 🐦🔥 and the gentle
      butterfly 🦋 who spreads kindness wherever she goes.
    </p>

    <p>I love your kind heart and your beautiful soul. ✨</p>

    <p>I love the way you love me and always treat me right. 🫂</p>

    <p>I love the way you handle things.</p>

    <p>And of course, I love how incredibly beautiful you are. 😍❤️</p>

    <p>I'm truly grateful that such a wonderful soul chose to love me. 🥹💙</p>

    <p>
      Why would I ever leave you or even think about someone else when I have someone as amazing as
      you by my side? 🫂❤️
    </p>

    <p>I will never leave you.</p>

    <p>
      I've always wanted to be loved by someone like you, someone who loves me for who I truly am
      and for my character, without ever making me feel like I have to perform or pretend to be
      someone else. ❤️
    </p>

    <p>
      I'm incredibly lucky to have you in my life, and I'm truly grateful for the unconditional love
      you show me every single day. 🫂💙
    </p>

    <p>I want to spend this life, and every moment of it, with you.</p>

    <p>Forever. ♾️💙</p>

    <p>My humble request is this.</p>

    <p>Please take good care of yourself. ❤️</p>

    <p>
      Build your self-esteem, stay healthy, and take care of your body and mind, not just for
      yourself, but for us. 🌸
    </p>

    <p>
      And please enjoy your new big black beast,{" "}
      <button
        type='button'
        onClick={onGiftClick}
        className={`font-black tracking-wide text-black-500 hover:text-rose-600 decoration-rose-300 underline-offset-4 cursor-pointer transition-colors`}
      >
        BE6 🖤⚡
      </button>
      , but drive carefully and stay safe.
    </p>

    <p>Because I can't lose you. 🥺🫂❤️</p>

    <p>
      As you become one year older today, I pray that all your wishes, dreams, and goals come true.
      🌠✨
    </p>

    <p>
      May this year bring you endless happiness, good health, success, peace, and countless
      beautiful memories.
    </p>

    <p>Thank you for being you.</p>

    <p>Thank you for loving me.</p>

    <p>And thank you for making my life so much more beautiful. 💙🫂</p>

    <p>🎉 Happy 25th Birthday, Chello! 🫂😘🎂💙</p>

    <p>Here's to celebrating many more birthdays together, forever. ♾️❤️</p>
  </>
);

const albumImageModules = import.meta.glob("./images/*.{jpg,jpeg,png,webp,avif}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const startDate = new Date(2023, 7, 1); // Aug 1, 2023
const timeDiff = new Date().getTime() - startDate.getTime();
const randomDates = Array.from({ length: Object.keys(albumImageModules).length }, () => {
  return new Date(startDate.getTime() + Math.random() * timeDiff);
}).sort((a, b) => a.getTime() - b.getTime());

const albumMemories = Object.entries(albumImageModules).map(([filePath, imagePath], index) => {
  const fileName =
    filePath
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, "") // strip extension
      ?.replace(/^\d+\.\s*/, "") ?? // strip leading "1. " / "2. " etc.
    `Memory ${index + 1}`;

  const dateString =
    randomDates[index]?.toLocaleDateString("en-US", { year: "numeric", month: "short" }) ||
    "Aug 2023";

  return {
    id: index + 1,
    caption: fileName,
    imagePath,
    dateString,
  };
});

const floatingEmojis = ["🎉", "🎂", "✨", "🌟", "🎁"];

function getTimeLeft(targetDate: Date) {
  const difference = targetDate.getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export function WishPage() {
  const [now, setNow] = useState(() => new Date());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [puzzleSolved, setPuzzleSolved] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return window.localStorage.getItem(puzzleSolvedKey) === "true";
    } catch {
      return false;
    }
  });
  const [revealedPiece, setRevealedPiece] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return window.localStorage.getItem(puzzlePieceKey);
    } catch {
      return null;
    }
  });
  const [letterUnlocked, setLetterUnlocked] = useState(false);
  const [openedMemories, setOpenedMemories] = useState<number[]>([]);
  const [showCracker, setShowCracker] = useState(false);
  const [lightboxMemory, setLightboxMemory] = useState<{
    id: number;
    imagePath: string;
    caption: string;
  } | null>(null);
  const [confettiBursts, setConfettiBursts] = useState<
    Array<{ id: number; x: number; y: number; emojis: string[] }>
  >([]);
  const [crackerDismissed, setCrackerDismissed] = useState(false);

  const letterRef = useRef<HTMLDivElement>(null);
  const puzzleSurpriseRef = useRef<HTMLDivElement>(null);

  const targetDate = useMemo(() => {
    const birthday = new Date();
    birthday.setMonth(6, 11);
    birthday.setHours(0, 0, 0, 0);

    if (birthday.getTime() < Date.now()) {
      birthday.setFullYear(birthday.getFullYear() + 1);
    }

    return birthday;
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const savedLocalChoice = window.localStorage.getItem(storageKey);
      if (savedLocalChoice) {
        setSelectedOption(savedLocalChoice);
      }
      const isLetterUnlocked = window.localStorage.getItem(letterKey) === "true";
      setLetterUnlocked(isLetterUnlocked);
      const savedPuzzleSolved = window.localStorage.getItem(puzzleSolvedKey) === "true";
      const savedPuzzlePiece = window.localStorage.getItem(puzzlePieceKey);
      if (savedPuzzleSolved) {
        setPuzzleSolved(true);
      }
      if (savedPuzzlePiece) {
        setRevealedPiece(savedPuzzlePiece);
      }
    } catch {
      // Ignore local storage access errors.
    }
  }, []);

  const triggerConfetti = (
    e?: React.MouseEvent | { x: number; y: number },
    options?: { blueOnly?: boolean },
  ) => {
    let x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
    let y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;
    if (e) {
      if ("clientX" in e) {
        x = e.clientX;
        y = e.clientY;
      } else {
        x = e.x;
        y = e.y;
      }
    }
    const id = Date.now() + Math.random();
    const defaultEmojis = ["🎉", "🎂", "✨", "💙", "💖", "🎁", "🌟", "🎈", "🌸", "🥳"];
    const emojis = options?.blueOnly ? ["💙", "🩵"] : defaultEmojis;
    const burstEmojis = Array.from(
      { length: 14 },
      () => emojis[Math.floor(Math.random() * emojis.length)],
    );

    setConfettiBursts((prev) => [...prev, { id, x, y, emojis: burstEmojis }]);
    setTimeout(() => {
      setConfettiBursts((prev) => prev.filter((b) => b.id !== id));
    }, 1500);
  };

  const timeLeft = getTimeLeft(targetDate);
  const isTimeUp =
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  useEffect(() => {
    if (isTimeUp) {
      setShowCracker(true);
    }
  }, [isTimeUp]);

  useEffect(() => {
    if (showCracker) {
      const timer = window.setTimeout(() => {
        setShowCracker(false);
        setCrackerDismissed(true);
      }, 7000);
      return () => window.clearTimeout(timer);
    }
  }, [showCracker]);

  useEffect(() => {
    if (!showCracker) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showCracker]);

  const handleSelect = (option: string) => {
    setSelectedOption(option);
    setShowCelebration(true);
    setSaveStatus("idle");

    try {
      window.localStorage.setItem(storageKey, option);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }

    window.setTimeout(() => setShowCelebration(false), 1800);
  };

  const handlePuzzleReveal = (piece: string, e?: React.MouseEvent) => {
    if (puzzleSolved) {
      return;
    }

    setRevealedPiece(piece);
    if (piece === "💙") {
      setPuzzleSolved(true);
      triggerConfetti(e, { blueOnly: true });
      try {
        window.localStorage.setItem(puzzleSolvedKey, "true");
        window.localStorage.setItem(puzzlePieceKey, piece);
      } catch {
        // Ignore local storage errors.
      }
      setTimeout(() => {
        puzzleSurpriseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const handleUnlockLetter = (e?: React.MouseEvent) => {
    setLetterUnlocked(true);
    triggerConfetti(e);
    try {
      window.localStorage.setItem(letterKey, "true");
    } catch {
      // Ignore local storage errors
    }
    setTimeout(() => {
      letterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleOpenMemory = (memoryId: number, e?: React.MouseEvent) => {
    setOpenedMemories((prev) => {
      const alreadyOpened = prev.includes(memoryId);
      if (alreadyOpened) return prev;
      // if (prev.length === 0) {
      triggerConfetti(e);
      // }
      return [...prev, memoryId];
    });
  };

  const handleReplayCracker = () => {
    setShowCracker(true);
  };

  return (
    <div className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.18),_transparent_35%),linear-gradient(135deg,_#fff7ed_0%,_#fdf2f8_45%,_#f5f3ff_100%)] p-4 sm:p-6 lg:p-8'>
      <style>{`
        @keyframes floaty {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(4deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244,114,182,0.35); }
          50% { box-shadow: 0 0 0 10px rgba(244,114,182,0.05); }
        }
        @keyframes cracker-pop {
          0% { transform: scale(0.85) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.08) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(-4deg); opacity: 1; }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(260px) rotate(720deg); opacity: 0; }
        }
        @keyframes sparkle-spin {
          0% { transform: rotate(0deg) scale(0.95); opacity: 0.6; }
          100% { transform: rotate(360deg) scale(1.04); opacity: 1; }
        }
        @keyframes burst-pop {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .wish-float { animation: floaty 3.2s ease-in-out infinite; }
        .wish-shimmer {
          position: relative;
          overflow: hidden;
        }
        .wish-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          animation: shimmer 2.8s linear infinite;
          transform: translateX(-100%);
        }
        .celebration-pop { animation: popIn 0.35s ease-out; }
        .puzzle-piece { animation: pulseGlow 1.8s ease-in-out infinite; }
        .cracker-overlay {
          animation: popIn 0.25s ease-out;
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(12px);
        }
        .cracker-card {
          animation: burst-pop 0.35s ease-out;
        }
        .cracker-body {
          animation: cracker-pop 0.45s ease-out;
        }
        .cracker-ring {
          animation: sparkle-spin 1.8s linear infinite;
        }
        .confetti-piece {
          animation: confetti-fall 1.8s ease-out forwards;
        }
        @keyframes memoryRevealImg {
          0% { opacity: 0; transform: scale(1.08) rotateY(12deg); filter: blur(6px); }
          60% { opacity: 1; transform: scale(1.02) rotateY(-2deg); filter: blur(1px); }
          100% { opacity: 1; transform: scale(1) rotateY(0deg); filter: blur(0); }
        }
        @keyframes memoryLockFade {
          0% { opacity: 1; transform: scale(1) rotateY(0deg); }
          100% { opacity: 0; transform: scale(0.85) rotateY(-20deg); }
        }
        .memory-reveal-img {
          animation: memoryRevealImg 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .memory-lock-fade {
          animation: memoryLockFade 0.35s ease-in forwards;
          pointer-events: none;
        }
        @keyframes letterUnfold {
          0% {
            opacity: 0;
            transform: perspective(1000px) rotateX(-15deg) translateY(30px);
          }
          100% {
            opacity: 1;
            transform: perspective(1000px) rotateX(0deg) translateY(0);
          }
        }
        .letter-unfold {
          animation: letterUnfold 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top center;
        }
        @keyframes confettiBurstParticle {
          0% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(var(--scale));
            opacity: 0;
          }
        }
      `}</style>

      {showCracker && (
        <div className='cracker-overlay fixed inset-0 z-[60] flex h-screen items-center justify-center overflow-hidden px-4 py-6'>
          <div className='cracker-card relative w-full max-w-md overflow-hidden rounded-[2rem] border border-rose-200/80 bg-gradient-to-br from-white via-rose-50 to-sky-50 p-8 text-center shadow-[0_30px_120px_rgba(244,114,182,0.28)]'>
            <div className='absolute inset-0 bg-[radial-gradient(circle,_rgba(59,130,246,0.14),_transparent_55%)]' />
            <div className='absolute left-5 top-5 h-14 w-14 rounded-full border border-rose-200/70' />
            <div className='absolute right-6 top-6 h-10 w-10 rounded-full border border-sky-200/70' />
            <div className='absolute bottom-6 left-6 h-12 w-12 rounded-full border border-fuchsia-200/70' />
            <div className='relative z-10 flex flex-col items-center gap-4'>
              <div className='cracker-body relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-fuchsia-500 to-sky-500 text-5xl text-white shadow-[0_20px_45px_rgba(236,72,153,0.3)]'>
                <div className='cracker-ring absolute inset-[-8px] rounded-full border-4 border-white/70' />
                🎉
                <div className='absolute -left-8 top-5 h-12 w-2 rounded-full bg-rose-500'></div>
                <div className='absolute -right-8 top-5 h-12 w-2 rounded-full bg-sky-500'></div>
              </div>
              <div className='space-y-2'>
                <p className='text-2xl font-black uppercase tracking-[0.3em] text-rose-600'>
                  🎁🫂💙😘🎂
                </p>
                <p className='text-sm font-semibold uppercase tracking-[0.35em] text-slate-600'>
                  Happy Birthday, My Love💕!
                </p>
              </div>
            </div>
            <div className='absolute inset-0'>
              <span className='confetti-piece absolute left-10 top-6 h-3 w-3 rounded-full bg-rose-500' />
              <span
                className='confetti-piece absolute left-20 top-10 h-3 w-3 rounded-full bg-yellow-400'
                style={{ animationDelay: "0.1s" }}
              />
              <span
                className='confetti-piece absolute left-32 top-8 h-3 w-3 rounded-full bg-blue-400'
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className='confetti-piece absolute right-16 top-8 h-3 w-3 rounded-full bg-fuchsia-500'
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className='confetti-piece absolute right-10 top-14 h-3 w-3 rounded-full bg-cyan-400'
                style={{ animationDelay: "0.05s" }}
              />
              <span
                className='confetti-piece absolute left-1/2 top-4 h-3 w-3 rounded-full bg-emerald-400'
                style={{ animationDelay: "0.12s" }}
              />
            </div>
          </div>
        </div>
      )}
      {confettiBursts.map((burst) => (
        <div key={burst.id} className='pointer-events-none fixed inset-0 z-[100]'>
          {burst.emojis.map((emoji, idx) => {
            const angle = (idx / burst.emojis.length) * 2 * Math.PI + (Math.random() - 0.5) * 0.3;
            const dist = 100 + Math.random() * 150;
            const tx = `${Math.cos(angle) * dist}px`;
            const ty = `${Math.sin(angle) * dist}px`;
            const rot = `${(Math.random() - 0.5) * 720}deg`;
            const scale = 0.8 + Math.random() * 0.8;
            const delay = `${Math.random() * 0.1}s`;

            return (
              <span
                key={idx}
                className='absolute text-2xl select-none'
                style={{
                  left: burst.x,
                  top: burst.y,
                  transform: "translate(-50%, -50%)",
                  animation: "confettiBurstParticle 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards",
                  animationDelay: delay,
                  ["--tx" as any]: tx,
                  ["--ty" as any]: ty,
                  ["--rot" as any]: rot,
                  ["--scale" as any]: scale,
                }}
              >
                {emoji}
              </span>
            );
          })}
        </div>
      ))}

      {lightboxMemory && (
        <div
          className='fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 transition-all duration-300 cursor-pointer'
          onClick={() => setLightboxMemory(null)}
        >
          <div
            className='relative max-w-3xl w-full flex flex-col items-center gap-4 celebration-pop'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type='button'
              className='absolute -top-12 right-0 text-white hover:text-rose-200 text-4xl font-bold bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer'
              onClick={() => setLightboxMemory(null)}
            >
              ✕
            </button>
            <img
              src={lightboxMemory.imagePath}
              alt={lightboxMemory.caption}
              className='max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10'
            />
            <p className='text-white text-lg font-semibold tracking-wide text-center'>
              {lightboxMemory.caption}
            </p>
          </div>
        </div>
      )}

      {isTimeUp && crackerDismissed && !showCracker && (
        <button
          type='button'
          onClick={handleReplayCracker}
          className='fixed bottom-6 right-6 z-[50] flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500 text-white px-5 py-3 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm font-bold tracking-wider uppercase border border-white/30 backdrop-blur-sm cursor-pointer'
        >
          <span>🎉 Replay Celebration</span>
        </button>
      )}

      <div className='mx-auto flex max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_25px_80px_rgba(244,114,182,0.2)] backdrop-blur-xl'>
        <div className='relative overflow-hidden px-6 py-8 text-center sm:px-10 sm:py-12 lg:px-14 lg:py-16'>
          <div className='absolute inset-0 bg-[radial-gradient(circle,_rgba(251,191,36,0.2),_transparent_55%)]' />
          <div className='absolute left-4 top-4 hidden text-4xl sm:block wish-float'>🎈</div>
          <div
            className='absolute bottom-4 right-6 hidden text-4xl sm:block wish-float'
            style={{ animationDelay: "1s" }}
          >
            🎂
          </div>

          <div className='relative z-10'>
            <div className='mx-auto mb-6 inline-flex items-center rounded-full border border-rose-200 bg-rose-50/80 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-rose-600'>
              To my love, on your special day
            </div>

            <h1 className='text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl'>
              {!isTimeUp ? "Advance " : ""}Happy Birthday, Sweety! 💙
            </h1>

            <p className='mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg'>
              For the one who makes my world softer, brighter, and more beautiful, the day is all
              about you. May your heart feel cherished, your smile stay bright, and your year be
              filled with everything you deserve.
            </p>

            <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
              {floatingEmojis.map((emoji, index) => (
                <span
                  key={emoji}
                  className='wish-float rounded-full bg-white/80 p-3 text-2xl shadow-lg backdrop-blur'
                  style={{ animationDelay: `${index * 0.3}s` }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className='grid gap-6 border-t border-rose-100 bg-gradient-to-br from-white/80 to-rose-50/70 px-6 py-8 sm:px-10 lg:px-14 lg:py-10'>
          <div className='space-y-5'>
            <div className='wish-shimmer rounded-[1.5rem] border border-rose-200 bg-gradient-to-br from-rose-500 to-fuchsia-500 p-6 text-left text-white shadow-xl'>
              <p className='text-sm font-semibold uppercase tracking-[0.3em] text-rose-100'>
                Countdown to your celebration day
              </p>
              <h2 className='mt-3 text-2xl font-bold sm:text-3xl'>
                {targetDate.toLocaleDateString("en", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <p className='mt-3 text-sm text-rose-50 sm:text-base'>
                Every second is a little spark of joy. Here’s the countdown until the party begins.
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-4'>
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Minutes", value: timeLeft.minutes },
                { label: "Seconds", value: timeLeft.seconds },
              ].map((item) => (
                <div
                  key={item.label}
                  className='rounded-2xl border border-slate-200 bg-white/90 p-4 text-center shadow-sm'
                >
                  <div className='text-3xl font-black text-slate-900'>
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className='mt-1 text-sm font-medium uppercase tracking-[0.2em] text-slate-500'>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-6 border-t border-rose-100/50 pt-5'>
              <p className='text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-3 text-center sm:text-left'>
                Your Surprise Progress
              </p>
              <div className='flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/60 rounded-2xl p-4 border border-slate-100 backdrop-blur-sm shadow-sm'>
                <div className='flex flex-wrap gap-3 justify-center sm:justify-start'>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      letterUnlocked
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-rose-50 border-rose-200 text-rose-700"
                    }`}
                  >
                    <span>💌</span>
                    <span>Letter: {letterUnlocked ? "Unlocked ✓" : "Tap to Open"}</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      openedMemories.length === albumMemories.length
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : openedMemories.length > 0
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-rose-50 border-rose-200 text-rose-700"
                    }`}
                  >
                    <span>📸</span>
                    <span>
                      Memories: {openedMemories.length}/{albumMemories.length} Opened
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      puzzleSolved
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-rose-50 border-rose-200 text-rose-700"
                    }`}
                  >
                    <span>🧩</span>
                    <span>Puzzle: {"Solved ✓"}</span>
                  </div>
                </div>

                {
                  <div className='w-full sm:w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50'>
                    <div
                      className='bg-gradient-to-r from-blue-50 via-fuchsia-500 to-emerald-500 h-full transition-all duration-500 ease-out'
                      style={{
                        width: `${
                          (((letterUnlocked ? 1 : 0) +
                            (puzzleSolved ? 1 : 0) +
                            openedMemories.length / albumMemories.length) /
                            3) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
        <div className='px-6 pb-8 sm:px-10 lg:px-14'>
          {!letterUnlocked ? (
            <button
              type='button'
              onClick={(e) => handleUnlockLetter(e)}
              className={`w-full rounded-[1.5rem] border border-blue-300 bg-gradient-to-br from-blue-400 to-blue-500 p-8 text-center shadow-lg transition`}
            >
              <p className='text-sm font-semibold uppercase tracking-[0.35em] text-white/90'>
                A love letter from my heart, which you have been asking for a long time...
              </p>
              <div className='mt-6 inline-block rounded-3xl border-2 border-white/80 p-4'>
                <p className='text-5xl'>🔒</p>
              </div>
              <p className='mt-6 text-base font-semibold text-white'>{"Tap to open 💙"}</p>
            </button>
          ) : (
            <div
              ref={letterRef}
              className='letter-unfold w-full rounded-[1.5rem] border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 shadow-lg'
            >
              <p className='text-2xl font-black italic text-blue-600'>To My Sweetheart...</p>
              <div className='mt-6 space-y-4 text-base leading-8 text-slate-700'>
                <LetterContent
                  onGiftClick={(e) => {
                    triggerConfetti(e);
                    setLightboxMemory({
                      id: -1,
                      imagePath: biggestGiftImage,
                      caption: "Your Biggest Gift 🎁",
                    });
                  }}
                />
              </div>
              <div className='mt-8 space-y-1 text-right'>
                <p className='text-lg font-bold italic text-blue-500'>With all my heart,</p>
                <p className='text-xl font-black text-blue-600'>My Love</p>
              </div>
            </div>
          )}

          <div className='mt-8'>
            <h2 className='text-center text-3xl font-black text-blue-600 sm:text-4xl'>
              Our Timeline Memories
            </h2>
            <p className='mt-3 text-center text-sm text-slate-600'>
              Scroll through our beautiful journey together 💙
            </p>

            <div className='relative mt-12 space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-blue-300 before:via-blue-200 before:to-transparent'>
              {albumMemories.map((memory, idx) => {
                const isOpened = openedMemories.includes(memory.id);

                return (
                  <div
                    key={memory.id}
                    className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group cursor-pointer`}
                  >
                    {/* Timeline Dot */}
                    <div className='flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-500 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10'>
                      <span className='text-sm'>{isOpened ? "📸" : "🔒"}</span>
                    </div>

                    {/* Content Card */}
                    <div
                      className='w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] celebration-pop'
                      style={{ animationDelay: `${(idx % 10) * 0.1}s` }}
                    >
                      <button
                        type='button'
                        onClick={(e) => {
                          if (isOpened) {
                            setLightboxMemory(memory);
                          } else {
                            handleOpenMemory(memory.id, e);
                          }
                        }}
                        className='w-full text-left'
                      >
                        <div className='rounded-[1.5rem] border border-blue-200 bg-white/90 p-4 shadow-lg transition hover:shadow-xl hover:-translate-y-1'>
                          <div className='flex items-center justify-between mb-3'>
                            <h3 className='font-bold text-blue-600 truncate mr-2'>
                              {memory.caption}
                            </h3>
                            {/* <span className='text-xs font-bold text-slate-500 px-3 py-1 bg-slate-100 rounded-full whitespace-nowrap'>
                              {memory.dateString}
                            </span> */}
                          </div>

                          <div
                            className='aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 relative'
                            style={{ perspective: "600px" }}
                          >
                            {isOpened && (
                              <img
                                src={memory.imagePath}
                                alt={memory.caption}
                                className='memory-reveal-img h-full w-full object-cover'
                              />
                            )}
                            {!isOpened && (
                              <div className='absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-rose-100 to-fuchsia-100 p-4 text-center'>
                                <span className='text-4xl'>🔒</span>
                                <p className='mt-3 text-sm font-semibold text-rose-600'>
                                  {"Tap to open"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className='mt-8 rounded-[1.25rem] border border-blue-200 bg-white/90 p-5 shadow-sm'>
            <p className='text-sm font-semibold uppercase tracking-[0.3em] text-blue-500'>
              Surprise puzzle
            </p>
            <h4 className='mt-3 text-lg font-bold text-slate-900'>
              Find the hidden heart piece to reveal your birthday surprise ✨{" "}
              {!puzzleSolved && (
                <span className='text-sm font-semibold text-rose-600'>(Find now 💙)</span>
              )}
              {/* {!puzzleSolved && !isTimeUp && (
                <span className='text-sm font-semibold text-rose-600'>
                  (Find on your birthday - 🎂)
                </span>
              )} */}
            </h4>

            <div className='mt-5 grid gap-3 sm:grid-cols-3'>
              {puzzlePieces.map((piece) => {
                const isRevealed = revealedPiece === piece || (puzzleSolved && piece === "💙");

                return (
                  <button
                    key={piece}
                    type='button'
                    onClick={(e) => handlePuzzleReveal(piece, e)}
                    disabled={puzzleSolved}
                    className={`puzzle-piece rounded-2xl border p-4 text-3xl transition ${
                      isRevealed
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    } ${puzzleSolved ? "cursor-not-allowed opacity-80" : ""}`}
                  >
                    {isRevealed ? piece : "❓"}
                  </button>
                );
              })}
            </div>

            {puzzleSolved && (
              <div className='celebration-pop mt-5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-sm font-semibold text-white'>
                🎉 You found the heart! Your birthday surprise is ready, my love.
              </div>
            )}
          </div>

          {puzzleSolved && (
            <div
              ref={puzzleSurpriseRef}
              className='mt-6 rounded-[1.25rem] border border-blue-200 bg-white/90 p-5 shadow-sm'
            >
              <p className='text-sm font-semibold uppercase tracking-[0.3em] text-blue-500'>
                Special day surprise plan
              </p>
              <h4 className='mt-3 text-lg font-bold text-slate-900'>
                Where can we go on this special day which you have been asking me for so long?
              </h4>

              <div className='mt-4 space-y-3'>
                {celebrationOptions.map((option) => {
                  const isSelected = selectedOption === option;
                  return (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 text-sm transition ${
                        isSelected
                          ? "border-blue-400 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-blue-200"
                      }`}
                    >
                      <input
                        type='radio'
                        name='birthday-plan'
                        className='mt-1 h-4 w-4 accent-blue-500'
                        checked={isSelected}
                        onChange={() => handleSelect(option)}
                      />
                      <span className='leading-6 text-slate-700'>{option}</span>
                    </label>
                  );
                })}
              </div>

              {showCelebration && selectedOption && (
                <div className='celebration-pop mt-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white'>
                  🎉 Perfect choice, my love! That sounds absolutely beautiful.
                </div>
              )}

              {saveStatus === "saved" && (
                <div className='mt-3 text-sm font-medium text-emerald-600'>
                  Saved to your birthday plan ✨
                </div>
              )}

              {saveStatus === "error" && (
                <div className='mt-3 text-sm font-medium text-blue-600'>
                  We could not save this right now. Please try again.
                </div>
              )}
            </div>
          )}
          {letterUnlocked && puzzleSolved && (
            <div className='mt-10 rounded-2xl bg-gradient-to-br from-rose-50 to-fuchsia-50 p-6 border border-rose-200 text-center shadow-sm'>
              <p className='text-sm font-semibold uppercase tracking-[0.2em] text-rose-500 mb-2'>
                One More Small Surprise
              </p>
              <p className='text-base font-bold text-slate-800'>
                I have a small surprise for you... It is about the biggest gift you are receiving.
                Find the keyword and click it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
