import { apiRequest } from "@/lib/api/client";
import { TeachingOptions } from "../types";

export const teachingService = {
  getOptions(): Promise<TeachingOptions> {
    return apiRequest<TeachingOptions>("/api/teaching-options");
  },
};
