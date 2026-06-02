'use client';

import { useEffect, useState } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { api, type ApiResponse } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { LinesPattern } from '@/components/ui/BackgroundPattern';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignees: Array<{ user: { id: string; name: string; avatar: string | null } }>;
  createdBy: { id: string; name: string; avatar: string | null };
}

const COLUMNS: { id: Task['status']; label: string; color: string }[] = [
  { id: 'TODO', label: 'To Do', color: 'bg-brand-gray' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-400' },
  { id: 'DONE', label: 'Done', color: 'bg-emerald-400' },
  { id: 'BLOCKED', label: 'Blocked', color: 'bg-brand-red' },
];

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  LOW: 'text-brand-gray-dark',
  MEDIUM: 'text-amber-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-brand-red',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
  const { success, error } = useToast();

  useEffect(() => {
    api.get<ApiResponse<Task[]>>('/tasks')
      .then((r) => setTasks(r.data.data ?? []))
      .catch(() => setTasks([
        { id: '1', title: 'Review brand guidelines', status: 'TODO', priority: 'HIGH', assignees: [], createdBy: { id: '1', name: 'Alex Carter', avatar: null } },
        { id: '2', title: 'Update campaign assets', status: 'IN_PROGRESS', priority: 'MEDIUM', assignees: [], createdBy: { id: '2', name: 'Jane Smith', avatar: null } },
        { id: '3', title: 'Finalize Q4 report', status: 'DONE', priority: 'LOW', assignees: [], createdBy: { id: '1', name: 'Alex Carter', avatar: null } },
      ]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async () => {
    try {
      const response = await api.post<ApiResponse<Task>>('/tasks', { ...form, status: 'TODO' });
      setTasks((prev) => [response.data.data!, ...prev]);
      success('Task created');
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
    } catch {
      error('Failed to create task');
    }
  };

  const updateStatus = async (taskId: string, newStatus: Task['status']) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    await api.put(`/tasks/${taskId}`, { status: newStatus }).catch(() => {});
  };

  const columnTasks = (status: Task['status']) => tasks.filter((t) => t.status === status);

  return (
    <div className="relative space-y-6 animate-fade-in">
      <LinesPattern opacity={0.45} />
      <div className="relative z-10 page-header">
        <h1 className="page-title">Tasks</h1>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreate(true)}
          iconLeft={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
        >
          New Task
        </Button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="space-y-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging) updateStatus(dragging, col.id);
              setDragging(null);
            }}
          >
            {/* Column header */}
            <div className="flex items-center gap-2">
              <div className={cn('w-2.5 h-2.5 rounded-full', col.color)} />
              <span className="text-sm font-semibold text-brand-black">{col.label}</span>
              <span className="ml-auto text-xs font-bold text-brand-gray-dark bg-brand-white-soft px-1.5 py-0.5 rounded">
                {columnTasks(col.id).length}
              </span>
            </div>

            {/* Task cards */}
            <div className="space-y-2.5 min-h-[100px]">
              {columnTasks(col.id).map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragging(task.id)}
                  onDragEnd={() => setDragging(null)}
                  className={cn(
                    'card card-hover p-4 cursor-grab active:cursor-grabbing',
                    dragging === task.id && 'opacity-50 rotate-2'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-brand-black leading-tight">{task.title}</p>
                    <span className={cn('text-[10px] font-bold uppercase flex-shrink-0 mt-0.5', PRIORITY_COLORS[task.priority])}>
                      {task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-[10px] text-brand-gray-dark mb-2 truncate-2">{task.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    {task.dueDate && (
                      <span className="text-[10px] text-brand-gray-dark">Due {formatDate(task.dueDate)}</span>
                    )}
                    <div className="ml-auto flex -space-x-1.5">
                      {task.assignees.slice(0, 3).map((a) => (
                        <Avatar key={a.user.id} name={a.user.name} src={a.user.avatar} size="xs" showRing />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {columnTasks(col.id).length === 0 && (
                <div className="border-2 border-dashed border-brand-gray rounded-lg p-6 text-center">
                  <p className="text-[10px] text-brand-gray-dark">Drop tasks here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New task"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={!form.title.trim()}>Create Task</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-black mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="input-field" placeholder="Task title" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-black mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="input-field resize-none" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-black mb-1.5">Priority</label>
              <select aria-label="Task priority" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className="input-field">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-black mb-1.5">Due date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="input-field" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
