"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const TASK_ICONS = [
  "🛏️", "🦷", "🧹", "📚", "🎒", "🥗", "🧺", "🗑️", "🐕", "🌱",
  "🧼", "🍽️", "📖", "✏️", "🏃", "🎵", "🎨", "🧘", "💪", "🧠",
  "⭐", "🌟", "✨", "💫", "🎯", "🏆", "🎁", "💎", "🌈", "🔥",
];

type TimeOfDay = "morning" | "evening" | "special";

export default function ParentTasksPage() {
  const children = useQuery(api.children.listByFamily);
  const [selectedChildId, setSelectedChildId] = useState<Id<"children"> | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<{
    _id: Id<"taskTemplates">;
    name: string;
    icon: string;
    points: number;
    timeOfDay: TimeOfDay;
  } | null>(null);

  const selectedChild =
    selectedChildId && children
      ? children.find((c) => c._id === selectedChildId)
      : children?.[0];

  const tasks = useQuery(
    api.tasks.getTemplates,
    selectedChild ? { childId: selectedChild._id } : "skip"
  );

  const createTemplate = useMutation(api.tasks.createTemplate);
  const updateTemplate = useMutation(api.tasks.updateTemplate);
  const deleteTemplate = useMutation(api.tasks.deleteTemplate);

  const morningTasks = tasks?.filter((t) => t.timeOfDay === "morning") ?? [];
  const eveningTasks = tasks?.filter((t) => t.timeOfDay === "evening") ?? [];
  const specialTasks = tasks?.filter((t) => t.timeOfDay === "special") ?? [];

  if (!children) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a29bfe]"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👶</div>
        <h2 className="text-2xl font-bold mb-2">אין ילדים עדיין</h2>
        <p className="text-gray-500 mb-6">הוסף ילד ראשון כדי לנהל משימות</p>
        <a
          href="/parent/children"
          className="inline-block bg-[#a29bfe] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#8b84e8] transition-colors"
        >
          הוסף ילד
        </a>
      </div>
    );
  }

  const handleAddTask = async (task: {
    name: string;
    icon: string;
    points: number;
    timeOfDay: TimeOfDay;
  }) => {
    if (!selectedChild) return;
    await createTemplate({
      childId: selectedChild._id,
      ...task,
    });
    setShowAddModal(false);
  };

  const handleUpdateTask = async (task: {
    name: string;
    icon: string;
    points: number;
    timeOfDay: TimeOfDay;
  }) => {
    if (!editingTask) return;
    await updateTemplate({
      templateId: editingTask._id,
      ...task,
    });
    setEditingTask(null);
  };

  const handleDeleteTask = async (templateId: Id<"taskTemplates">) => {
    if (confirm("האם אתה בטוח שברצונך למחוק משימה זו?")) {
      await deleteTemplate({ templateId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#a29bfe]">ניהול משימות</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#a29bfe] text-white px-4 py-2 rounded-xl hover:bg-[#8b84e8] transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          הוסף משימה
        </button>
      </div>

      {/* Child Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {children.map((child) => (
          <button
            key={child._id}
            onClick={() => setSelectedChildId(child._id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedChild?._id === child._id
                ? "text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            style={
              selectedChild?._id === child._id
                ? { backgroundColor: child.theme }
                : undefined
            }
          >
            <span className="text-xl">{child.avatar}</span>
            <span className="font-medium">{child.name}</span>
          </button>
        ))}
      </div>

      {selectedChild && (
        <>
          {/* Morning Tasks */}
          <TaskSection
            title="משימות בוקר"
            icon="🌅"
            tasks={morningTasks}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
            emptyMessage="אין משימות בוקר"
          />

          {/* Evening Tasks */}
          <TaskSection
            title="משימות ערב"
            icon="🌙"
            tasks={eveningTasks}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
            emptyMessage="אין משימות ערב"
          />

          {/* Special Tasks */}
          <TaskSection
            title="משימות מיוחדות"
            icon="⭐"
            tasks={specialTasks}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
            emptyMessage="אין משימות מיוחדות"
            highlight
          />
        </>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingTask) && (
        <TaskModal
          task={editingTask}
          onSave={editingTask ? handleUpdateTask : handleAddTask}
          onClose={() => {
            setShowAddModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}

function TaskSection({
  title,
  icon,
  tasks,
  onEdit,
  onDelete,
  emptyMessage,
  highlight,
}: {
  title: string;
  icon: string;
  tasks: Array<{
    _id: Id<"taskTemplates">;
    name: string;
    icon: string;
    points: number;
    timeOfDay: TimeOfDay;
  }>;
  onEdit: (task: { _id: Id<"taskTemplates">; name: string; icon: string; points: number; timeOfDay: TimeOfDay }) => void;
  onDelete: (id: Id<"taskTemplates">) => void;
  emptyMessage: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm ${highlight ? "ring-2 ring-[#ffd93d]" : ""}`}>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        {title}
        <span className="text-sm font-normal text-gray-500">({tasks.length})</span>
      </h3>

      {tasks.length === 0 ? (
        <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                {task.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{task.name}</div>
                <div className="text-sm text-[#22d1c6]">+{task.points} נקודות</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(task)}
                  className="p-2 text-gray-500 hover:text-[#a29bfe] hover:bg-[#a29bfe]/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button
                  onClick={() => onDelete(task._id)}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskModal({
  task,
  onSave,
  onClose,
}: {
  task: { name: string; icon: string; points: number; timeOfDay: TimeOfDay } | null;
  onSave: (task: { name: string; icon: string; points: number; timeOfDay: TimeOfDay }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(task?.name ?? "");
  const [icon, setIcon] = useState(task?.icon ?? "⭐");
  const [points, setPoints] = useState(task?.points ?? 10);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(task?.timeOfDay ?? "morning");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, points, timeOfDay });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">
          {task ? "ערוך משימה" : "הוסף משימה חדשה"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium mb-2">אייקון</label>
            <button
              type="button"
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="w-16 h-16 text-3xl bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              {icon}
            </button>
            {showIconPicker && (
              <div className="mt-2 p-3 bg-gray-100 rounded-xl grid grid-cols-10 gap-2">
                {TASK_ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setIcon(i);
                      setShowIconPicker(false);
                    }}
                    className={`w-8 h-8 text-xl hover:bg-white rounded transition-colors ${
                      icon === i ? "bg-white shadow" : ""
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">שם המשימה</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: לסדר את החדר"
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a29bfe]"
              required
            />
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium mb-2">נקודות</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
              min="1"
              max="100"
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a29bfe]"
              required
            />
          </div>

          {/* Time of Day */}
          <div>
            <label className="block text-sm font-medium mb-2">זמן ביום</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "morning" as TimeOfDay, label: "בוקר", icon: "🌅" },
                { value: "evening" as TimeOfDay, label: "ערב", icon: "🌙" },
                { value: "special" as TimeOfDay, label: "מיוחד", icon: "⭐" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTimeOfDay(option.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    timeOfDay === option.value
                      ? "border-[#a29bfe] bg-[#a29bfe]/10"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#a29bfe] text-white rounded-xl hover:bg-[#8b84e8] transition-colors font-medium"
            >
              {task ? "שמור" : "הוסף"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
