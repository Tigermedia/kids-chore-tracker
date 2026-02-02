import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Sequence,
  Audio,
  staticFile,
} from "remotion";

// ===== CONSTANTS =====
const COLORS = {
  bg: "#f7f9fc",
  bgDark: "#1a1a2e",
  primary: "#22d1c6",
  primaryLight: "#4ecdc4",
  secondary: "#a29bfe",
  gold: "#ffd700",
  pink: "#ff6b6b",
  green: "#95e1d3",
  yellow: "#ffd93d",
  purple: "#a29bfe",
  text: "#2c3e50",
  textLight: "#7f8c8d",
  white: "#ffffff",
};

const FONT_FAMILY = `"Rubik", "Assistant", Arial, sans-serif`;
const fontUrl =
  "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap";

// ===== HELPER COMPONENTS =====

const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      top: 180,
      left: 90,
      width: 900,
      height: 1600,
      borderRadius: 50,
      background: COLORS.white,
      boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      overflow: "hidden",
      border: "3px solid #e0e0e0",
    }}
  >
    <div
      style={{
        height: 50,
        background: COLORS.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 180,
          height: 6,
          background: "rgba(255,255,255,0.3)",
          borderRadius: 3,
        }}
      />
    </div>
    <div style={{ height: 1550, overflow: "hidden" }}>{children}</div>
  </div>
);

const TaskItem: React.FC<{
  icon: string;
  name: string;
  points: number;
  completed: boolean;
  animateAt?: number;
  frame: number;
  fps: number;
}> = ({ icon, name, points, completed, animateAt, frame, fps }) => {
  const isAnimating = animateAt !== undefined && frame >= animateAt;
  const checkScale = isAnimating
    ? spring({ frame: frame - animateAt, fps, config: { damping: 8, stiffness: 200 } })
    : completed
    ? 1
    : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "22px 28px",
        margin: "0 24px 14px",
        borderRadius: 20,
        background: completed || isAnimating ? "#e8faf8" : COLORS.white,
        border: `2px solid ${completed || isAnimating ? COLORS.primary : "#eee"}`,
        direction: "rtl",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 40 }}>{icon}</span>
        <span
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: COLORS.text,
            fontFamily: FONT_FAMILY,
            textDecoration: completed || isAnimating ? "line-through" : "none",
            opacity: completed || isAnimating ? 0.6 : 1,
          }}
        >
          {name}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: COLORS.gold,
            fontFamily: FONT_FAMILY,
          }}
        >
          +{points}
        </span>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            background: completed || isAnimating ? COLORS.primary : "#eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${checkScale})`,
          }}
        >
          <span style={{ color: "white", fontSize: 22, fontWeight: 700 }}>✓</span>
        </div>
      </div>
    </div>
  );
};

// ===== SCENES =====

const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const emojiFloat = Math.sin(frame / 10) * 15;
  const emoji2Float = Math.cos(frame / 8) * 12;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 50%, ${COLORS.pink} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 300,
          right: 120,
          fontSize: 80,
          transform: `translateY(${emojiFloat}px) rotate(15deg)`,
        }}
      >
        ⭐
      </span>
      <span
        style={{
          position: "absolute",
          top: 500,
          left: 100,
          fontSize: 70,
          transform: `translateY(${emoji2Float}px) rotate(-10deg)`,
        }}
      >
        🏆
      </span>
      <span
        style={{
          position: "absolute",
          bottom: 400,
          right: 150,
          fontSize: 90,
          transform: `translateY(${-emojiFloat}px) rotate(5deg)`,
        }}
      >
        🎯
      </span>
      <span
        style={{
          position: "absolute",
          bottom: 600,
          left: 130,
          fontSize: 75,
          transform: `translateY(${-emoji2Float}px) rotate(-15deg)`,
        }}
      >
        ✨
      </span>

      <div style={{ transform: `scale(${titleScale})`, textAlign: "center" }}>
        <div style={{ fontSize: 120, marginBottom: 20 }}>📋</div>
        <h1
          style={{
            fontSize: 82,
            fontWeight: 800,
            color: COLORS.white,
            margin: 0,
            textShadow: "0 4px 20px rgba(0,0,0,0.2)",
            lineHeight: 1.2,
          }}
        >
          מעקב משימות
        </h1>
        <h2
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: COLORS.yellow,
            margin: "10px 0 0",
            textShadow: "0 4px 15px rgba(0,0,0,0.2)",
          }}
        >
          לילדים
        </h2>
      </div>
      <p
        style={{
          fontSize: 36,
          color: "rgba(255,255,255,0.9)",
          marginTop: 40,
          opacity: subtitleOpacity,
          fontWeight: 500,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        הפכו משימות יומיות למשחק מהנה! 🎮
      </p>
    </AbsoluteFill>
  );
};

const SceneDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const translateY = interpolate(slideIn, [0, 1], [100, 0]);

  const tasks = [
    { icon: "👕", name: "להתלבש", points: 5, completed: true },
    { icon: "🪥", name: "לצחצח שיניים", points: 5, completed: true },
    { icon: "🛏️", name: "לסדר את המיטה", points: 10, completed: false, animateAt: 50 },
    { icon: "🥣", name: "לאכול ארוחת בוקר", points: 5, completed: false },
  ];

  const basePoints = 135;
  const addPoints =
    frame >= 50
      ? interpolate(frame, [50, 70], [0, 10], { extrapolateRight: "clamp" })
      : 0;

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        fontFamily: FONT_FAMILY,
        direction: "rtl",
      }}
    >
      <PhoneFrame>
        <div
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
            padding: "30px 28px 24px",
            transform: `translateY(${translateY}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: COLORS.white,
                  margin: 0,
                }}
              >
                שלום, הילי! 👋
              </h2>
              <p
                style={{
                  fontSize: 22,
                  color: "rgba(255,255,255,0.8)",
                  margin: "6px 0 0",
                }}
              >
                משימות הבוקר ☀️
              </p>
            </div>
            <div
              style={{
                textAlign: "center",
                background: "rgba(255,255,255,0.2)",
                borderRadius: 20,
                padding: "12px 24px",
              }}
            >
              <div
                style={{ fontSize: 36, fontWeight: 800, color: COLORS.yellow }}
              >
                ⭐ {Math.round(basePoints + addPoints)}
              </div>
              <div style={{ fontSize: 18, color: "rgba(255,255,255,0.7)" }}>
                נקודות
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 12,
              height: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${frame >= 50 ? interpolate(frame, [50, 70], [50, 75], { extrapolateRight: "clamp" }) : 50}%`,
                height: "100%",
                background: COLORS.yellow,
                borderRadius: 12,
              }}
            />
          </div>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.7)",
              margin: "8px 0 0",
              textAlign: "center",
            }}
          >
            {frame >= 50 ? "3" : "2"} מתוך 4 משימות הושלמו
          </p>
        </div>

        <div style={{ margin: "20px 24px 10px", display: "flex", gap: 16 }}>
          <div
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #ff6b6b, #ffa07a)",
              borderRadius: 18,
              padding: "16px 20px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 32 }}>🔥</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.white }}>
              5 ימים
            </div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>רצף</div>
          </div>
          <div
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #a29bfe, #6c5ce7)",
              borderRadius: 18,
              padding: "16px 20px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 32 }}>🏆</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.white }}>
              רמה 3
            </div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>דרגה</div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          {tasks.map((task, i) => {
            const taskDelay = i * 6;
            const taskOpacity = interpolate(
              frame,
              [taskDelay, taskDelay + 10],
              [0, 1],
              { extrapolateRight: "clamp" }
            );
            return (
              <div key={i} style={{ opacity: taskOpacity }}>
                <TaskItem
                  icon={task.icon}
                  name={task.name}
                  points={task.points}
                  completed={task.completed}
                  animateAt={task.animateAt}
                  frame={frame}
                  fps={fps}
                />
              </div>
            );
          })}
        </div>
      </PhoneFrame>
    </AbsoluteFill>
  );
};

const SceneCelebration: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 8, stiffness: 120 } });
  const pointsPop = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  const confetti = Array.from({ length: 30 }, (_, i) => {
    const x = Math.sin(i * 2.39) * 400 + 540;
    const startY = 800;
    const speed = 3 + (i % 5) * 2;
    const y = startY - frame * speed + Math.sin(frame / 5 + i) * 30;
    const rotation = frame * (3 + (i % 4)) * (i % 2 === 0 ? 1 : -1);
    const colors = [COLORS.gold, COLORS.pink, COLORS.primary, COLORS.purple, COLORS.green];
    const color = colors[i % colors.length];
    const size = 12 + (i % 3) * 6;
    const opacity = interpolate(frame, [0, 10, 60, 75], [0, 1, 1, 0], {
      extrapolateRight: "clamp",
    });
    return { x, y, rotation, color, size, opacity };
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${COLORS.bg} 0%, #e8faf8 100%)`,
        fontFamily: FONT_FAMILY,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {confetti.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: c.x,
            top: c.y,
            width: c.size,
            height: c.size * 0.6,
            background: c.color,
            borderRadius: 3,
            transform: `rotate(${c.rotation}deg)`,
            opacity: c.opacity,
          }}
        />
      ))}

      <div style={{ transform: `scale(${scale})`, textAlign: "center" }}>
        <div style={{ fontSize: 140 }}>🎉</div>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: COLORS.primary,
            margin: "20px 0",
          }}
        >
          כל הכבוד!
        </h1>
        <p style={{ fontSize: 38, color: COLORS.textLight, fontWeight: 500 }}>
          המשימה הושלמה!
        </p>
      </div>

      <div
        style={{
          transform: `scale(${pointsPop})`,
          marginTop: 50,
          background: `linear-gradient(135deg, ${COLORS.gold}, #ffaa00)`,
          borderRadius: 30,
          padding: "24px 60px",
          boxShadow: "0 10px 40px rgba(255,215,0,0.4)",
        }}
      >
        <span style={{ fontSize: 52, fontWeight: 800, color: COLORS.white }}>
          +10 נקודות ⭐
        </span>
      </div>
    </AbsoluteFill>
  );
};

const SceneShop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rewards = [
    { icon: "📺", name: "30 דקות טלוויזיה", cost: 50 },
    { icon: "🍦", name: "גלידה", cost: 75 },
    { icon: "🎮", name: "משחק מחשב", cost: 60 },
    { icon: "🌙", name: "להישאר ער", cost: 100 },
    { icon: "🎁", name: "מתנה הפתעה", cost: 200 },
    { icon: "🎢", name: "יום בילוי", cost: 500 },
  ];

  return (
    <AbsoluteFill
      style={{ background: COLORS.bg, fontFamily: FONT_FAMILY, direction: "rtl" }}
    >
      <PhoneFrame>
        <div
          style={{
            background: `linear-gradient(135deg, ${COLORS.purple}, #6c5ce7)`,
            padding: "30px 28px 28px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 40, fontWeight: 700, color: COLORS.white, margin: 0 }}>
            🛍️ חנות הפרסים
          </h2>
          <div
            style={{
              marginTop: 14,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 16,
              padding: "10px 20px",
              display: "inline-block",
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 700, color: COLORS.yellow }}>
              ⭐ 145 נקודות
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            padding: "20px 20px",
            gap: 16,
            justifyContent: "center",
          }}
        >
          {rewards.map((reward, i) => {
            const delay = i * 5;
            const itemScale = spring({
              frame: Math.max(0, frame - delay),
              fps,
              config: { damping: 12, stiffness: 150 },
            });
            const canAfford = reward.cost <= 145;

            return (
              <div
                key={i}
                style={{
                  width: 260,
                  background: COLORS.white,
                  borderRadius: 24,
                  padding: "24px 16px",
                  textAlign: "center",
                  border: `2px solid ${canAfford ? COLORS.primary : "#eee"}`,
                  transform: `scale(${itemScale})`,
                  boxShadow: canAfford
                    ? "0 4px 20px rgba(34,209,198,0.15)"
                    : "none",
                }}
              >
                <span style={{ fontSize: 52 }}>{reward.icon}</span>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: COLORS.text,
                    margin: "10px 0 8px",
                  }}
                >
                  {reward.name}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: canAfford ? COLORS.primary : COLORS.textLight,
                    background: canAfford ? "#e8faf8" : "#f5f5f5",
                    borderRadius: 12,
                    padding: "6px 16px",
                    display: "inline-block",
                  }}
                >
                  ⭐ {reward.cost}
                </div>
              </div>
            );
          })}
        </div>
      </PhoneFrame>
    </AbsoluteFill>
  );
};

const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const ctaScale = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 10, stiffness: 120 },
  });
  const pulse = 1 + Math.sin(frame / 8) * 0.03;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 50%, ${COLORS.pink} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ transform: `scale(${titleScale})`, textAlign: "center" }}>
        <div style={{ fontSize: 100, marginBottom: 20 }}>⚡</div>
        <h1
          style={{
            fontSize: 68,
            fontWeight: 800,
            color: COLORS.white,
            margin: 0,
            textShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          הפכו שגרה
        </h1>
        <h1
          style={{
            fontSize: 68,
            fontWeight: 800,
            color: COLORS.yellow,
            margin: "10px 0 0",
            textShadow: "0 4px 15px rgba(0,0,0,0.2)",
          }}
        >
          למשחק!
        </h1>
      </div>

      <div style={{ marginTop: 60, transform: `scale(${ctaScale * pulse})` }}>
        <div
          style={{
            background: COLORS.white,
            borderRadius: 30,
            padding: "28px 60px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          }}
        >
          <span style={{ fontSize: 38, fontWeight: 700, color: COLORS.primary }}>
            התחילו עכשיו - חינם! 🚀
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 200,
          display: "flex",
          gap: 30,
          opacity: interpolate(frame, [30, 50], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        {["⭐", "🏆", "🎮", "🔥", "🎯"].map((emoji, i) => (
          <span
            key={i}
            style={{
              fontSize: 50,
              transform: `translateY(${Math.sin(frame / 10 + i) * 10}px)`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ===== MAIN COMPOSITION WITH AUDIO =====
export const DemoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY }}>
      <link href={fontUrl} rel="stylesheet" />

      {/* ===== AUDIO LAYERS ===== */}

      {/* Background music - plays through entire video, lower volume */}
      <Audio
        src={staticFile("sounds/bgmusic.wav")}
        startFrom={0}
        volume={0.15}
      />

      {/* Intro whoosh */}
      <Sequence from={0} durationInFrames={60}>
        <Audio src={staticFile("sounds/whoosh.mp3")} volume={0.5} />
      </Sequence>

      {/* Task complete sound - when task gets checked at frame 140 (scene2 frame 50 + scene2 start at 90) */}
      <Sequence from={140} durationInFrames={45}>
        <Audio src={staticFile("sounds/success.mp3")} volume={0.6} />
      </Sequence>

      {/* Celebration fanfare */}
      <Sequence from={210} durationInFrames={90}>
        <Audio src={staticFile("sounds/celebration.mp3")} volume={0.7} />
      </Sequence>

      {/* Coin/points sound at celebration */}
      <Sequence from={225} durationInFrames={45}>
        <Audio src={staticFile("sounds/coin.wav")} volume={0.5} />
      </Sequence>

      {/* Shop pop sounds */}
      <Sequence from={300} durationInFrames={30}>
        <Audio src={staticFile("sounds/pop.wav")} volume={0.3} />
      </Sequence>

      {/* Outro whoosh */}
      <Sequence from={390} durationInFrames={40}>
        <Audio src={staticFile("sounds/whoosh.mp3")} volume={0.5} />
      </Sequence>

      {/* ===== VIDEO SCENES ===== */}

      <Sequence from={0} durationInFrames={90}>
        <SceneIntro />
      </Sequence>

      <Sequence from={90} durationInFrames={120}>
        <SceneDashboard />
      </Sequence>

      <Sequence from={210} durationInFrames={90}>
        <SceneCelebration />
      </Sequence>

      <Sequence from={300} durationInFrames={90}>
        <SceneShop />
      </Sequence>

      <Sequence from={390} durationInFrames={60}>
        <SceneOutro />
      </Sequence>
    </AbsoluteFill>
  );
};
