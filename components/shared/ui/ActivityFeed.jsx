import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Edit, Plus, Trash2, UserPlus } from "lucide-react";

const iconMap = { TASK_CREATED: Plus, STATUS_CHANGED: ArrowRight, ASSIGNEE_CHANGED: UserPlus, PRIORITY_CHANGED: Edit, TASK_DELETED: Trash2 };
const colorMap = { TASK_CREATED: "text-emerald-500", STATUS_CHANGED: "text-blue-500", ASSIGNEE_CHANGED: "text-accent", PRIORITY_CHANGED: "text-orange-500", TASK_DELETED: "text-destructive" };

export function ActivityFeed({ activities }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {activities.map((activity) => {
            const Icon = iconMap[activity.type] || Edit;
            return (
              <div key={activity.id} className="flex items-start gap-4 p-6 hover:bg-secondary/5 transition-colors">
                <div className={`mt-1 p-2 rounded-full bg-secondary/20 ${colorMap[activity.type] || "text-foreground"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      <span className="font-bold">{activity.actor}</span> {activity.detail}
                    </p>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{activity.resource}</Badge>
                    <span className="text-xs text-muted-foreground">{activity.type.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}