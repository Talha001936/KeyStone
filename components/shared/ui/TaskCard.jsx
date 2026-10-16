import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";

export function TaskCard({ task, basePath }) {
  return (
    <Link href={`${basePath}/tasks/${task.id}`}>
      <Card className="hover:border-accent transition-colors cursor-pointer">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
            <PriorityBadge priority={task.priority} />
          </div>
          <p className="font-medium text-sm">{task.title}</p>
          <div className="flex items-center justify-between pt-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent-foreground">
              {task.assignee}
            </div>
            <StatusBadge status={task.status} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}