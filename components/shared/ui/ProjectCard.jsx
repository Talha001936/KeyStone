import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar } from "lucide-react";

export function ProjectCard({ project, basePath }) {
  return (
    <Link href={`${basePath}/projects/${project.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {project.members}</div>
            <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {project.due}</div>
            <div>{project.tasks} tasks</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}