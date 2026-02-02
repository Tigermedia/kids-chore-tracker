"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Confetti } from "../../../../components/celebration/Confetti";
import { useChild } from "../../../../contexts/ChildContext";

export default function TasksPage() {
  const { selectedChild, children, isLoading } = useChild();
  const [showCelebration, setShowCelebration] = useState(false);

  const tasks = useQuery(
    api.tasks.getTodayTasks,
    selectedChild ? { childId: selectedChild._id } : "skip"
  );

  const completeTask = useMutation(api.tasks.completeTask);
  const uncompleteTask = useMutation(api.tasks.uncompleteTask);

  const handleTaskToggle = async (
    task: NonNullable<typeof tasks>[0]
  ) => {
    if (!selectedChild) return;

    if (task.isCompleted && task.completionId) {
      await uncompleteTask({ completionId: task.completionId });
    } else {
      await completeTask({
        childId: selectedChild._id,
        taskTemplateId: task._id,
      });
      // Show celebration animation
      setShowCelebration(true);
    }
  };

  if (isLoading || !children) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22d1c6]"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👶</div>
        <h2 className="text-2xl font-bold mb-2">אין ילדים עדיין</h2>
        <p className="text-gray-500 mb-6">הוסף ילד ראשון כדי להתחיל</p>
        <a
          href="/dashboard"
          className="inline-block bg-[#22d1c6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1db8ae] transition-colors"
        >
          חזור לדף הבית
        </a>
      </div>
    );
  }

  if (!selectedChild) {
    return null;
  }

  const morningTasks = tasks?.filter((t) => t.timeOfDay === "morning") ?? [];
  const eveningTasks = tasks?.filter((t) => t.timeOfDay === "evening") ?? [];
  const specialTasks = tasks?.filter((t) => t.timeOfDay === "special") ?? [];

  const completedCount = tasks?.filter((t) => t.isCompleted).length ?? 0;
  const totalCount = tasks?.length ?? 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Celebration Animation */}
      <Confetti show={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* Progress Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">משימות היום</h2>
          <div className="text-[#22d1c6] font-bold">
            {completedCount}/{totalCount}
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#22d1c6] to-[#a29bfe] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && (
          <div className="text-center mt-3 text-[#22d1c6] font-bold">
            🎉 כל הכבוד! השלמת את כל המשימות!
          </div>
        )}
      </div>

      {/* Morning Tasks */}
      {morningTasks.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🌅</span>
            משימות בוקר
          </h3>
          <div className="space-y-3">
            {morningTasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                onToggle={() => handleTaskToggle(task)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Evening Tasks */}
      {eveningTasks.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🌙</span>
            משימות ערב
          </h3>
          <div className="space-y-3">
            {eveningTasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                onToggle={() => handleTaskToggle(task)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Special Tasks */}
      {specialTasks.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            משימות מיוחדות
          </h3>
          <div className="space-y-3">
            {specialTasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                onToggle={() => handleTaskToggle(task)}
              />
            ))}
          </div>
        </div>
      )}

      {tasks?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <p>אין משימות עדיין</p>
          <p className="text-sm mt-2">ההורים יכולים להוסיף משימות במצב הורה</p>
        </div>
      )}
    </div>
  );
}

function TaskItem({
  task,
  onToggle,
}: {
  task: {
    _id: Id<"taskTemplates">;
    name: string;
    icon: string;
    points: number;
    isCompleted: boolean;
    frequency?: string;
  };
  onToggle: () => void;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(task.name);
      utterance.lang = "he-IL";
      utterance.rate = 0.9;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [task.name]
  );

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
        task.isCompleted
          ? "bg-green-50 border-2 border-green-200"
          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
          task.isCompleted ? "bg-green-200" : "bg-white"
        }`}
      >
        {task.isCompleted ? "✅" : task.icon}
      </div>
      <div className="flex-1 text-right">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium ${task.isCompleted ? "line-through text-gray-400" : ""}`}
          >
            {task.name}
          </span>
          <span
            onClick={handleSpeak}
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-base cursor-pointer hover:bg-gray-200 transition-all ${
              isSpeaking ? "animate-pulse bg-blue-100" : ""
            }`}
            role="button"
            aria-label="הקרא שם משימה"
          >
            🔊
          </span>
        </div>
        <div className="text-sm text-[#22d1c6]">+{task.points} נקודות</div>
      </div>
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
          task.isCompleted
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300"
        }`}
      >
        {task.isCompleted && (
          <span className="material-symbols-outlined text-sm">check</span>
        )}
      </div>
    </button>
  );
}
