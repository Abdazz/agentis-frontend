import { notFound } from 'next/navigation'
import { TaskFeed } from '@/components/task-feed'
import { HitlPanel } from '@/components/tasks/HitlPanel'

type Task = { id: string; goal: string; status: string }

async function getTask(taskId: string): Promise<Task | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/tasks/${taskId}`,
      { cache: 'no-store' }
    )
    if (res.status === 404) return null
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function TaskPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const task = await getTask(id)
  if (!task) notFound()

  return (
    <div className="h-full">
      <TaskFeed taskId={task.id} status={task.status} goal={task.goal} />
      <HitlPanel taskId={task.id} />
    </div>
  )
}
