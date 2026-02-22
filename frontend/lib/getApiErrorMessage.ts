import axios from "axios";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;

    if (isRecord(data)) {
      const direct = getString(data.message) ?? getString(data.error);
      if (direct) return direct;

      const errors = data.errors;
      if (Array.isArray(errors) && errors.length > 0 && isRecord(errors[0])) {
        const first = getString(errors[0].message);
        if (first) return first;
      }
    }

    const msg = getString(error.message);
    if (msg) return msg;
  }

  if (error instanceof Error) {
    const msg = getString(error.message);
    if (msg) return msg;
  }

  if (isRecord(error)) {
    const msg = getString(error.message);
    if (msg) return msg;
  }

  return fallback;
}
