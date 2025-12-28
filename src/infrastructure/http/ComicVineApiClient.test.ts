import axios from "axios";
import { ComicVineApiClient } from "./ComicVineApiClient";

jest.mock("axios");
jest.mock("../config/env", () => ({
  config: {
    comicVineApiKey: "test-api-key-1234567890abcdefghijklmnopqrstuvwxyz",
    apiBaseUrl: "https://comicvine.gamespot.com/api",
    isConfigured: true,
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("ComicVineApiClient", () => {
  let client: ComicVineApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Mock axios.isAxiosError with proper type predicate
    (mockedAxios.isAxiosError as any) = (error: any): error is any =>
      error?.isAxiosError === true;

    // Mock axios.isCancel with proper type predicate
    (mockedAxios.isCancel as any) = (_value: any): _value is any => false;

    client = new ComicVineApiClient();

    // Clear cache between tests
    client.clearCache();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    it("should make GET request with correct parameters", async () => {
      const mockResponse = {
        data: {
          error: "OK",
          results: [],
          number_of_total_results: 0,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.get("/characters/", { filter: "publisher:31", limit: 50 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/characters/",
        expect.objectContaining({
          params: { filter: "publisher:31", limit: 50 },
        }),
      );
    });

    it("should cache responses", async () => {
      const mockResponse = {
        data: {
          error: "OK",
          results: [{ id: 1, name: "Test" }],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // First call
      await client.get("/characters/", { limit: 50 });

      // Second call (should use cache)
      await client.get("/characters/", { limit: 50 });

      // Should only call API once
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it("should not use cache when useCache is false", async () => {
      const mockResponse = {
        data: { error: "OK", results: [] },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.get("/characters/", { limit: 50 }, { useCache: false });
      await client.get("/characters/", { limit: 50 }, { useCache: false });

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it("should expire cache after TTL", async () => {
      const mockResponse = {
        data: { error: "OK", results: [] },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.get("/characters/", { limit: 50 });

      // Simulate time passing (6 minutes)
      jest.spyOn(Date, "now").mockReturnValue(Date.now() + 6 * 60 * 1000);

      await client.get("/characters/", { limit: 50 });

      // Should call API twice (cache expired)
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it("should handle rate limiting", async () => {
      // Make 200 requests to hit rate limit
      const mockResponse = {
        data: { error: "OK", results: [] },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Make 200 requests
      for (let i = 0; i < 200; i++) {
        await client.get(`/character/${i}/`, {}, { useCache: false });
      }

      // 201st request should throw rate limit error
      await expect(
        client.get("/character/201/", {}, { useCache: false }),
      ).rejects.toThrow("Rate limit exceeded");
    });

    it("should cancel previous request for same endpoint", async () => {
      const abortSpy = jest.fn();
      global.AbortController = jest.fn().mockImplementation(() => ({
        abort: abortSpy,
        signal: {} as AbortSignal,
      })) as unknown as typeof AbortController;

      mockAxiosInstance.get
        .mockImplementationOnce(() => new Promise(() => {})) // Never resolves
        .mockResolvedValueOnce({ data: { error: "OK", results: [] } });

      // First request (will be cancelled)
      void client.get("/characters/", { limit: 50 });

      // Second request (should cancel first)
      const promise2 = client.get("/characters/", { limit: 50 });

      await promise2;

      // First request's abort controller should be called
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should throw ApiError for 401 unauthorized", async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: "Invalid API Key" },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.get("/characters/")).rejects.toThrow(
        "Invalid API key",
      );
    });

    it("should throw ApiError for 404 not found", async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { error: "Object Not Found" },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.get("/character/4005-999999/")).rejects.toThrow(
        "Resource not found",
      );
    });

    it("should throw ApiError for 429 rate limit", async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { error: "Rate Limit Exceeded" },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.get("/characters/")).rejects.toThrow(
        "Rate limit exceeded",
      );
    });

    it("should throw ApiError for 500 server error", async () => {
      // Use fake timers to skip retry delays (500 errors trigger retries with exponential backoff)
      jest.useFakeTimers();

      const error = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: "Internal Server Error" },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      // Start the request and set up assertion first
      const promiseAssertion = expect(
        client.get("/characters/"),
      ).rejects.toMatchObject({
        message: expect.stringContaining(
          "Comic Vine API is currently unavailable",
        ),
      });

      // Fast-forward through all retry delays (use async version for promises)
      await jest.runAllTimersAsync();

      // Wait for the assertion to complete
      await promiseAssertion;

      jest.useRealTimers();
    });

    it("should throw ApiError for timeout", async () => {
      // Use fake timers to skip retry delays (timeout errors trigger retries with exponential backoff)
      jest.useFakeTimers();

      const error = {
        isAxiosError: true,
        code: "ECONNABORTED",
        message: "timeout of 15000ms exceeded",
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      // Start the request and set up assertion first
      const promiseAssertion = expect(
        client.get("/characters/"),
      ).rejects.toMatchObject({
        message: expect.stringContaining("Request timeout"),
      });

      // Fast-forward through all retry delays (use async version for promises)
      await jest.runAllTimersAsync();

      // Wait for the assertion to complete
      await promiseAssertion;

      jest.useRealTimers();
    });

    it("should throw ApiError for network error", async () => {
      const error = {
        isAxiosError: true,
        request: {},
        message: "Network Error",
      };

      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.get("/characters/")).rejects.toThrow(
        "No response from Comic Vine API",
      );
    });
  });

  describe("cache management", () => {
    it("should clear cache", async () => {
      const mockResponse = {
        data: { error: "OK", results: [{ id: 1 }] },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Load data (cached)
      await client.get("/characters/", { limit: 50 });

      // Clear cache
      client.clearCache();

      // Load again (should hit API)
      await client.get("/characters/", { limit: 50 });

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });
  });

  describe("request cancellation", () => {
    it("should cancel all requests", () => {
      const abortSpy = jest.fn();
      global.AbortController = jest.fn().mockImplementation(() => ({
        abort: abortSpy,
        signal: {} as AbortSignal,
      })) as unknown as typeof AbortController;

      mockAxiosInstance.get.mockImplementation(() => new Promise(() => {}));

      // Start multiple requests
      client.get("/characters/", { limit: 50 });
      client.get("/issues/", { limit: 20 });

      // Cancel all
      client.cancelAllRequests();

      expect(abortSpy).toHaveBeenCalled();
    });

    it("should cancel specific request", () => {
      const abortSpy = jest.fn();
      global.AbortController = jest.fn().mockImplementation(() => ({
        abort: abortSpy,
        signal: {} as AbortSignal,
      })) as unknown as typeof AbortController;

      mockAxiosInstance.get.mockImplementation(() => new Promise(() => {}));

      client.get("/characters/", { limit: 50 });

      client.cancelRequest("/characters/", { limit: 50 });

      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe("rate limiter", () => {
    it("should track remaining requests", async () => {
      const mockResponse = {
        data: { error: "OK", results: [] },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const initialRemaining = client.getRemainingRequests();
      expect(initialRemaining).toBe(200);

      // Make a request
      await client.get("/characters/", { limit: 50 }, { useCache: false });

      const afterOneRequest = client.getRemainingRequests();
      expect(afterOneRequest).toBe(199);
    });
  });
});
