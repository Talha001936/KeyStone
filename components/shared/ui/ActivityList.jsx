"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function ActivityList({ activities, showProject = true }) {
  return (
    <div className="divide-y">
      {activities.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-4 p-5 hover:bg-muted/30 transition-colors"
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
              {a.initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">{a.actor}</span>{" "}
              <span className="text-muted-foreground">
                {a.type.toLowerCase()}
              </span>{" "}
              <span className="font-medium">{a.target}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {a.resource && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {a.resource}
                </Badge>
              )}
              {showProject && a.project && (
                <span className="text-xs text-muted-foreground">{a.project}</span>
              )}
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}