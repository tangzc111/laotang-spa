const BASE_URL = process.env.NODE_ENV === "development" ? "" : "https://www.tzcgws.xyz";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
};

export interface ApiErrorShape {
	message: string;
	status?: number;
	code?: number;
}

interface ApiResponse<T> {
	code: number;
	data: T;
	message: string;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { method = "GET", headers, body, ...rest } = options;
	const normalizedMethod = method.toUpperCase() as HttpMethod;
	const computedHeaders = new Headers(headers);

	if (body && !(body instanceof FormData) && !computedHeaders.has("Content-Type")) {
		computedHeaders.set("Content-Type", "application/json");
	}

	const response = await fetch(`${BASE_URL}${path}`, {
		method: normalizedMethod,
		headers: computedHeaders,
		body: (body && !(body instanceof FormData) ? JSON.stringify(body) : body) as BodyInit | null,
		...rest,
	});

	const contentType = response.headers.get("content-type");
	const isJson = contentType?.includes("application/json");
	const rawPayload = isJson ? await response.json() : await response.text();

	if (!response.ok) {
		const message =
			(typeof rawPayload === "string" && rawPayload) ||
			(rawPayload as ApiErrorShape)?.message ||
			"Request failed";
		const error: ApiErrorShape = { message, status: response.status };
		throw error;
	}

	// non-json payloads fallback to raw text
	if (!isJson) {
		return rawPayload as T;
	}

	const payload = rawPayload as ApiResponse<T>;

	if (typeof payload.code === "number" && payload.code !== 0) {
		const error: ApiErrorShape = {
			code: payload.code,
			message: payload.message || "Request failed",
			status: response.status,
		};
		throw error;
	}

	// Allow void returns (e.g. DELETE 204) but still unwrap envelope.
	return (payload.data ?? (undefined as T)) as T;
}

export { BASE_URL };
