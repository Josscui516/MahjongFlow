export type TaskSourceKind = "decision" | "discussion";

export type TaskSourceContext = Readonly<{
  meetingId: string;
  sourceId: string;
  sourceKind: TaskSourceKind;
  sourceContent: string;
}>;

export type TaskConversionCreateInput = Readonly<{
  assigneeId: string;
  description: string;
  dueDate: string;
  status: "not_started" | "in_progress" | "completed";
  title: string;
}>;

export type TaskConversionResult =
  | Readonly<{ ok: true; taskId: string; source: TaskSourceContext }>
  | Readonly<{
      ok: false;
      code: "duplicate" | "forbidden" | "source_missing" | "system" | "validation";
      errors?: readonly Readonly<{ field: keyof TaskConversionCreateInput; message: string }>[];
      message: string;
      source?: TaskSourceContext;
    }>;

export type TaskConversionPort = Readonly<{
  createFromSource(
    source: TaskSourceContext,
    input: TaskConversionCreateInput,
  ): Promise<TaskConversionResult>;
}>;

export type TaskSourceReader = Readonly<{
  read(sourceKind: TaskSourceKind, sourceId: string): Promise<TaskSourceContext | null>;
}>;
