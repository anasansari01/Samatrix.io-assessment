import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { projects, tasks, users } from '@/db/schema'
import { eq, count } from 'drizzle-orm'
import Link from 'next/link'

export default async function DashboardPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/auth/login')

  let myProjects, myTasks, todoCount, inProgressCount, doneCount

  if (currentUser.role === 'admin') {
    myProjects = await db.select({ count: count() }).from(projects)
    myTasks = await db.select({ count: count() }).from(tasks)
    todoCount = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'todo'))
    inProgressCount = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'in_progress'))
    doneCount = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'done'))
  } else {
    myProjects = await db.select({ count: count() }).from(projects).where(eq(projects.ownerId, currentUser.id))
    myTasks = await db.select({ count: count() }).from(tasks).where(eq(tasks.assignedTo, currentUser.id))
    todoCount = await db.select({ count: count() }).from(tasks)
      .where(eq(tasks.assignedTo, currentUser.id))
    inProgressCount = await db.select({ count: count() }).from(tasks)
      .where(eq(tasks.assignedTo, currentUser.id))
    doneCount = await db.select({ count: count() }).from(tasks)
      .where(eq(tasks.assignedTo, currentUser.id))
  }

  const recentProjects = currentUser.role === 'admin'
    ? await db.select().from(projects).limit(5)
    : await db.select().from(projects).where(eq(projects.ownerId, currentUser.id)).limit(5)

  const recentTasks = await db.select({
    id: tasks.id,
    title: tasks.title,
    status: tasks.status,
    priority: tasks.priority,
    projectId: tasks.projectId,
  }).from(tasks).limit(8)

  const stats = [
    { label: 'Total Projects', value: myProjects[0].count, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Total Tasks', value: myTasks[0].count, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: 'To Do', value: todoCount[0].count, color: 'bg-slate-50 text-slate-700 border-slate-200' },
    { label: 'Done', value: doneCount[0].count, color: 'bg-green-50 text-green-700 border-green-200' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Welcome back! Here's what's happening.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`border rounded-xl p-4 ${stat.color}`}>
            <p className="text-3xl font-bold">{String(stat.value)}</p>
            <p className="text-sm mt-1 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent Projects</h2>
            <Link href="/projects" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No projects yet</p>
              <Link href="/projects" className="text-blue-600 text-sm hover:underline mt-2 block">
                Create your first project
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">
                    {project.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    project.status === 'active' ? 'bg-green-100 text-green-700' :
                    project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {project.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent Tasks</h2>
          </div>

          {recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No tasks yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <span className="text-sm text-slate-700 flex-1 truncate">{task.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    task.status === 'done' ? 'bg-green-100 text-green-700' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
