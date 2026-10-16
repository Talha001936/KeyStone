
export const PROJECT_NAME_MAX = 120;
export const PROJECT_DESCRIPTION_MAX = 2000;
export const PROJECT_STATUSES = ["active", "planning", "on_hold"];

export const TASK_TITLE_MAX = 200;
export const TASK_DESCRIPTION_MAX = 5000;
export const TASK_STATUSES = ["todo", "in_progress", "done"];
export const TASK_PRIORITIES = ["low", "medium", "high"];

export const COMMENT_MAX = 5000;

export const WORKSPACE_NAME_MIN = 2;
export const WORKSPACE_NAME_MAX = 60;


export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDayUTC(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function blank(v) {
  return !v || (typeof v === "string" && v.trim() === "");
}

function fail(field, message) {
  return { ok: false, field, message };
}

function pass(value) {
  return { ok: true, value };
}

/* -------- Project validation -------- */
export function validateProject(input, mode = "create") {
  const out = {};

  if (mode === "create" || input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name) return fail("name", "Project name is required.");
    if (name.length > PROJECT_NAME_MAX) {
      return fail(
        "name",
        `Project name must be ${PROJECT_NAME_MAX} characters or fewer.`
      );
    }
    out.name = name;
  }

  if (input.description !== undefined && input.description !== null) {
    const description = String(input.description);
    if (description.length > PROJECT_DESCRIPTION_MAX) {
      return fail(
        "description",
        `Description must be ${PROJECT_DESCRIPTION_MAX} characters or fewer.`
      );
    }
    out.description = description;
  }

  if (input.status !== undefined) {
    const status = String(input.status).toLowerCase();
    if (!PROJECT_STATUSES.includes(status)) {
      return fail("status", "Invalid project status.");
    }
    out.status = status;
  }

  if (input.dueDate !== undefined) {
    if (input.dueDate === null || input.dueDate === "") {
      out.dueDate = null;
    } else {
      const d = new Date(input.dueDate);
      if (Number.isNaN(d.getTime())) {
        return fail("dueDate", "Invalid due date.");
      }
      const today = startOfDayUTC(new Date());
      const due = startOfDayUTC(d);
      if (due < today) {
        return fail("dueDate", "Due date cannot be in the past.");
      }
      out.dueDate = d.toISOString().slice(0, 10);
    }
  }

  return pass(out);
}

export function validateProjectDelete({ taskCount }) {
  if ((taskCount || 0) > 0) {
    return fail(
      "_delete",
      "This project still has tasks. Delete or move them before deleting the project."
    );
  }
  return pass({});
}

export function validateTask(input, mode = "create", ctx = {}) {
  const out = {};
  const { projectDueDate = null } = ctx;

  if (mode === "create" || input.title !== undefined) {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (!title) return fail("title", "Title is required.");
    if (title.length > TASK_TITLE_MAX) {
      return fail(
        "title",
        `Title must be ${TASK_TITLE_MAX} characters or fewer.`
      );
    }
    out.title = title;
  }

  if (input.description !== undefined && input.description !== null) {
    const description = String(input.description);
    if (description.length > TASK_DESCRIPTION_MAX) {
      return fail(
        "description",
        `Description must be ${TASK_DESCRIPTION_MAX} characters or fewer.`
      );
    }
    out.description = description;
  }

  if (input.status !== undefined) {
    const status = String(input.status).toLowerCase();
    if (!TASK_STATUSES.includes(status)) {
      return fail("status", "Invalid task status.");
    }
    out.status = status;
  }

  if (input.priority !== undefined) {
    const priority = String(input.priority).toLowerCase();
    if (!TASK_PRIORITIES.includes(priority)) {
      return fail("priority", "Invalid priority.");
    }
    out.priority = priority;
  }

  if (mode === "create") {
    if (blank(input.projectId)) {
      return fail("projectId", "A project is required.");
    }
    out.projectId = String(input.projectId);
  }

  if (input.assigneeId !== undefined) {
    if (input.assigneeId === null || input.assigneeId === "") {
      out.assigneeId = null;
    } else {
      out.assigneeId = String(input.assigneeId);
    }
  }

  if (input.dueDate !== undefined) {
    if (input.dueDate === null || input.dueDate === "") {
      out.dueDate = null;
    } else {
      const d = new Date(input.dueDate);
      if (Number.isNaN(d.getTime())) {
        return fail("dueDate", "Invalid due date.");
      }
      const today = startOfDayUTC(new Date());
      const due = startOfDayUTC(d);
      if (due < today) {
        return fail("dueDate", "Due date cannot be in the past.");
      }
      if (projectDueDate) {
        const projectDue = startOfDayUTC(projectDueDate);
        if (projectDue && due > projectDue) {
          return fail(
            "dueDate",
            "Due date cannot be after the project's due date."
          );
        }
      }
      out.dueDate = d.toISOString().slice(0, 10);
    }
  }

  return pass(out);
}

/* -------- Comment validation -------- */
export function validateComment(input) {
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!body) return fail("body", "Comment cannot be empty.");
  if (body.length > COMMENT_MAX) {
    return fail(
      "body",
      `Comment must be ${COMMENT_MAX} characters or fewer.`
    );
  }
  return pass({ body });
}

/* -------- Workspace validation -------- */
export function validateWorkspace(input, mode = "create") {
  const out = {};
  if (mode === "create" || input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length < WORKSPACE_NAME_MIN || name.length > WORKSPACE_NAME_MAX) {
      return fail(
        "name",
        `Workspace name must be ${WORKSPACE_NAME_MIN}–${WORKSPACE_NAME_MAX} characters.`
      );
    }
    out.name = name;
  }
  return pass(out);
}