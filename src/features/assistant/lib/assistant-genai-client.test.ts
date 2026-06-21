import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getAssistantImageModel,
  getAssistantModel,
  getAssistantThinkingConfig,
} from "@admin/features/assistant/lib/assistant-genai-client";

describe("assistant GenAI model selection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses GOOGLE_CLOUD_MODEL for text analysis", () => {
    vi.stubEnv("GOOGLE_CLOUD_MODEL", "gemini-text-model");

    expect(getAssistantModel()).toBe("gemini-text-model");
  });

  it("uses GOOGLE_CLOUD_IMAGE_MODEL for image analysis", () => {
    vi.stubEnv("GOOGLE_CLOUD_MODEL", "gemini-text-model");
    vi.stubEnv("GOOGLE_CLOUD_IMAGE_MODEL", "gemini-image-model");

    expect(getAssistantImageModel()).toBe("gemini-image-model");
  });

  it("falls back to the text model when image model is not configured", () => {
    vi.stubEnv("GOOGLE_CLOUD_MODEL", "gemini-text-model");
    vi.stubEnv("GOOGLE_CLOUD_IMAGE_MODEL", "");

    expect(getAssistantImageModel()).toBe("gemini-text-model");
  });

  it("omits thinking config by default", () => {
    vi.unstubAllEnvs();

    expect(getAssistantThinkingConfig()).toBeUndefined();
  });

  it("disables thinking only when budget env is zero", () => {
    vi.stubEnv("GOOGLE_CLOUD_THINKING_BUDGET", "0");

    expect(getAssistantThinkingConfig()).toEqual({ thinkingBudget: 0 });
  });

  it("ignores non-zero thinking budget env values", () => {
    vi.stubEnv("GOOGLE_CLOUD_THINKING_BUDGET", "40000");

    expect(getAssistantThinkingConfig()).toBeUndefined();
  });
});
