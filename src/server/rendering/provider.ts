export type RenderType =
  | "DESIGN_IMAGE"
  | "PANORAMA"
  | "THREE_D_SCENE"
  | "WALKTHROUGH"
  | "VIDEO"
  | "BEFORE_AFTER";

export type RenderRequest = {
  jobId: string;
  type: RenderType;
  input: Record<string, unknown>;
};

export type RenderSubmission = {
  providerJobId: string;
  provider: string;
};

export type RenderStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";

// Real, honest status result: outputUrl is only ever present when the
// provider itself reports SUCCEEDED and actually returned one - never
// fabricated, never assumed present just because the status is
// terminal. A provider that reports SUCCEEDED without a real output URL
// is a real, genuine provider-integration problem, not something to
// paper over with a guessed value.
export type RenderStatusResult = {
  status: RenderStatus;
  outputUrl?: string;
  contentType?: string;
};

export interface RenderingProvider {
  submit(request: RenderRequest): Promise<RenderSubmission>;
  getStatus(providerJobId: string): Promise<RenderStatusResult>;
}

type ProviderResponse = {
  providerJobId?: unknown;
  id?: unknown;
  status?: unknown;
  outputUrl?: unknown;
  output_url?: unknown;
  contentType?: unknown;
  content_type?: unknown;
};

const readJson = async (response: Response): Promise<ProviderResponse> => {
  const body = (await response.json().catch(() => ({}))) as ProviderResponse;
  if (!response.ok) {
    throw new Error(`RENDERING_PROVIDER_HTTP_${response.status}`);
  }
  return body;
};

const asJobId = (body: ProviderResponse): string => {
  const value = body.providerJobId ?? body.id;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("RENDERING_PROVIDER_JOB_ID_MISSING");
  }
  return value;
};

const asStatus = (value: unknown): RenderStatus => {
  if (
    value === "QUEUED" ||
    value === "RUNNING" ||
    value === "SUCCEEDED" ||
    value === "FAILED"
  ) {
    return value;
  }
  throw new Error("RENDERING_PROVIDER_STATUS_INVALID");
};

class HttpRenderingProvider implements RenderingProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly timeoutMs: number;

  constructor(baseUrl: string, apiKey: string | undefined, timeoutMs: number) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  private headers(): HeadersInit {
    return {
      "content-type": "application/json",
      ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
    };
  }

  private async request(
    url: string,
    init: RequestInit,
  ): Promise<ProviderResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await readJson(
        await fetch(url, {
          ...init,
          headers: this.headers(),
          signal: controller.signal,
        }),
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("RENDERING_PROVIDER_TIMEOUT");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async submit(request: RenderRequest): Promise<RenderSubmission> {
    const body = await this.request(`${this.baseUrl}/renders`, {
      method: "POST",
      body: JSON.stringify(request),
    });
    return { providerJobId: asJobId(body), provider: "http" };
  }

  async getStatus(providerJobId: string): Promise<RenderStatusResult> {
    const body = await this.request(
      `${this.baseUrl}/renders/${encodeURIComponent(providerJobId)}`,
      { method: "GET" },
    );
    const status = asStatus(body.status);
    if (status !== "SUCCEEDED") return { status };

    // Real providers may use either camelCase or snake_case for these
    // fields - both are checked rather than assuming one convention,
    // since this HTTP adapter is meant to work against any compliant
    // real provider, not one specific implementation's exact casing.
    const outputUrl = body.outputUrl ?? body.output_url;
    const contentType = body.contentType ?? body.content_type;
    return {
      status,
      outputUrl: typeof outputUrl === "string" ? outputUrl : undefined,
      contentType: typeof contentType === "string" ? contentType : undefined,
    };
  }
}

class UnconfiguredRenderingProvider implements RenderingProvider {
  async submit(): Promise<RenderSubmission> {
    throw new Error("RENDERING_PROVIDER_NOT_CONFIGURED");
  }
  async getStatus(): Promise<RenderStatusResult> {
    throw new Error("RENDERING_PROVIDER_NOT_CONFIGURED");
  }
}

export function getRenderingProvider(): RenderingProvider {
  const provider = process.env.RENDERING_PROVIDER?.trim();
  if (!provider) return new UnconfiguredRenderingProvider();

  if (provider === "http") {
    const baseUrl = process.env.RENDERING_PROVIDER_URL?.trim();
    if (!baseUrl) throw new Error("RENDERING_PROVIDER_URL_REQUIRED");
    const timeoutMs = Number(
      process.env.RENDERING_PROVIDER_TIMEOUT_MS ?? 30000,
    );
    if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120000) {
      throw new Error("RENDERING_PROVIDER_TIMEOUT_MS_INVALID");
    }
    return new HttpRenderingProvider(
      baseUrl,
      process.env.RENDERING_PROVIDER_API_KEY?.trim() || undefined,
      timeoutMs,
    );
  }

  throw new Error(`RENDERING_PROVIDER_UNSUPPORTED:${provider}`);
}
