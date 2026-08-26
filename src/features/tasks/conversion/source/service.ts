import type {
  TaskConversionCreateInput,
  TaskConversionPort,
  TaskConversionResult,
  TaskSourceKind,
  TaskSourceReader,
} from "./contracts";

export async function resolveTaskSource(
  sourceKind: TaskSourceKind,
  sourceId: string,
  reader: TaskSourceReader,
) {
  if (!sourceId) return null;
  return reader.read(sourceKind, sourceId);
}

export async function convertTaskSource(
  sourceKind: TaskSourceKind,
  sourceId: string,
  input: TaskConversionCreateInput,
  reader: TaskSourceReader,
  port: TaskConversionPort,
): Promise<TaskConversionResult> {
  const source = await resolveTaskSource(sourceKind, sourceId, reader);

  if (!source) {
    return {
      ok: false,
      code: "source_missing",
      message: "The meeting source is unavailable.",
    };
  }

  return port.createFromSource(source, input);
}
