'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignedTo: string | null
  assigneeName: string | null
  createdAt: string
}

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  ownerId: string
}

interface UserOption {
  id: string
  name: string
  email: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingProject, setEditingProject] = useState(false)

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskError, setTaskError] = useState('')
  const [taskSaving, setTaskSaving] = useState(false)

  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectStatus, setProjectStatus] = useState('')

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editPriority, setEditPriority] = useState('')
  const [editAssignee, setEditAssignee] = useState('')

  useEffect(() => {
    loadProject()
    loadUsers()
  }, [projectId])

  async function loadProject() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.status === 404) {
        router.push('/projects')
        return
      }
      if (res.status === 403) {
        router.push('/projects')
        return
      }
      const data = await res.json()
      setProject(data.data.project)
      setTasks(data.data.tasks)
      setProjectName(data.data.project.name)
      setProjectDesc(data.data.project.description || '')
      setProjectStatus(data.data.project.status)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data.data?.users || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    setTaskError('')

    if (!taskTitle.trim()) {
      setTaskError('Task title is required')
      return
    }

    setTaskSaving(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          projectId,
          assignedTo: taskAssignee || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setTaskError(data.error || 'Failed to create task')
        return
      }

      await loadProject()
      setTaskTitle('')
      setTaskDesc('')
      setTaskPriority('medium')
      setTaskAssignee('')
      setShowTaskForm(false)
    } catch (err) {
      setTaskError('Something went wrong')
    } finally {
      setTaskSaving(false)
    }
  }

  async function updateProject() {
    if (!projectName.trim()) return

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, description: projectDesc, status: projectStatus }),
      })
      if (res.ok) {
        const data = await res.json()
        setProject(data.data.project)
        setEditingProject(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function updateTask(taskId: string) {
    if (!editingTask) return

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          status: editStatus,
          priority: editPriority,
          assignedTo: editAssignee || null,
        }),
      })

      if (res.ok) {
        await loadProject()
        setEditingTask(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const todoTasks = tasks.filter((t) => t.status === 'todo')
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress')
  const doneTasks = tasks.filter((t) => t.status === 'done')

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-slate-100 rounded w-1/2 mb-8" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div>
      <div className="text-sm text-slate-500 mb-4">
        <Link href="/projects" className="hover:text-slate-700">Projects</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{project.name}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        {editingProject ? (
          <div className="space-y-3">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold text-lg outline-none focus:border-blue-500"
            />
            <textarea
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              placeholder="Description"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
              rows={2}
            />
            <select
              value={projectStatus}
              onChange={(e) => setProjectStatus(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <div className="flex gap-2">
              <button onClick={updateProject} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Save
              </button>
              <button onClick={() => setEditingProject(false)} className="border border-slate-300 px-4 py-1.5 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-slate-800">{project.name}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  project.status === 'active' ? 'bg-green-100 text-green-700' :
                  project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-slate-500 text-sm">{project.description}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">{tasks.length} tasks total</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingProject(true)}
                className="text-sm border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setShowTaskForm(true)}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Task
              </button>
            </div>
          </div>
        )}
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">New Task</h2>
            <form onSubmit={createTask} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign to</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {taskError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-sm">
                  {taskError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={taskSaving}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  {taskSaving ? 'Adding...' : 'Add Task'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowTaskForm(false); setTaskError('') }}
                  className="flex-1 border border-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Task</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign to</label>
                <select
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => updateTask(editingTask.id)}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingTask(null)}
                  className="flex-1 border border-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <TaskColumn
          title="To Do"
          count={todoTasks.length}
          color="bg-slate-100 text-slate-700"
          tasks={todoTasks}
          onEdit={(task) => {
            setEditingTask(task)
            setEditStatus(task.status)
            setEditPriority(task.priority)
            setEditAssignee(task.assignedTo || '')
          }}
          onDelete={deleteTask}
        />

        <TaskColumn
          title="In Progress"
          count={inProgressTasks.length}
          color="bg-blue-100 text-blue-700"
          tasks={inProgressTasks}
          onEdit={(task) => {
            setEditingTask(task)
            setEditStatus(task.status)
            setEditPriority(task.priority)
            setEditAssignee(task.assignedTo || '')
          }}
          onDelete={deleteTask}
        />

        <TaskColumn
          title="Done"
          count={doneTasks.length}
          color="bg-green-100 text-green-700"
          tasks={doneTasks}
          onEdit={(task) => {
            setEditingTask(task)
            setEditStatus(task.status)
            setEditPriority(task.priority)
            setEditAssignee(task.assignedTo || '')
          }}
          onDelete={deleteTask}
        />
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-semibold text-slate-700 mb-1">No tasks yet</h3>
          <p className="text-slate-400 text-sm">Add your first task to this project</p>
        </div>
      )}
    </div>
  )
}

function TaskColumn({
  title,
  count,
  color,
  tasks,
  onEdit,
  onDelete,
}: {
  title: string
  count: number
  color: string
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${color}`}>
          {count}
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-800 flex-1">{task.title}</p>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onEdit(task)}
                  className="text-slate-400 hover:text-blue-500 transition-colors text-xs"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors text-xs"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            {task.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {task.priority}
              </span>
              {task.assigneeName && (
                <span className="text-xs text-slate-500 truncate">
                  👤 {task.assigneeName}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">No tasks here</p>
      )}
    </div>
  )
}
