// components/shared/projects/ProjectCardMenu.jsx
"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export function ProjectCardMenu({ role, project, onDeleteRequested }) {
  const canEdit = role === "owner" || role === "admin";
  const canDelete = role === "owner";
  const hasTasks = (project.tasks || 0) > 0;

  if (!canEdit) return null;

  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={stop}
            aria-label="Open project actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          nativeButton={false}
          render={<Link href={`/${role}/projects/${project.slug}/settings`} onClick={stop} />}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit project
        </DropdownMenuItem>

        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={hasTasks}
              onClick={(e) => {
                stop(e);
                if (!hasTasks) onDeleteRequested?.(project);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {hasTasks ? "Delete (has tasks)" : "Delete project"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}