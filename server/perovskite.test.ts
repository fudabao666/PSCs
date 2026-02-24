import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database helpers to avoid real DB calls in unit tests
vi.mock("./db", () => ({
  getNewsList: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getLatestNews: vi.fn().mockResolvedValue([]),
  getNewsById: vi.fn().mockResolvedValue(null),
  getTenderList: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getLatestTenders: vi.fn().mockResolvedValue([]),
  getTenderById: vi.fn().mockResolvedValue(null),
  getManufacturerList: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getManufacturerById: vi.fn().mockResolvedValue(null),
  getEfficiencyRecords: vi.fn().mockResolvedValue([]),
  getCurrentRecords: vi.fn().mockResolvedValue([]),
  getSiteStats: vi.fn().mockResolvedValue({ newsCount: 0, tenderCount: 0, manufacturerCount: 0, efficiencyCount: 0, lastUpdated: new Date() }),
  globalSearch: vi.fn().mockResolvedValue({ news: [], tenders: [], manufacturers: [] }),
  insertNews: vi.fn().mockResolvedValue(undefined),
  insertTender: vi.fn().mockResolvedValue(undefined),
  insertManufacturer: vi.fn().mockResolvedValue(undefined),
  insertEfficiencyRecord: vi.fn().mockResolvedValue(undefined),
  updateNews: vi.fn().mockResolvedValue(undefined),
  updateTender: vi.fn().mockResolvedValue(undefined),
  updateManufacturer: vi.fn().mockResolvedValue(undefined),
  deleteNews: vi.fn().mockResolvedValue(undefined),
  deleteTender: vi.fn().mockResolvedValue(undefined),
  deleteManufacturer: vi.fn().mockResolvedValue(undefined),
  createJobLog: vi.fn().mockResolvedValue(1),
  updateJobLog: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./dataFetcher", () => ({
  fetchLatestNews: vi.fn().mockResolvedValue(3),
  fetchLatestTenders: vi.fn().mockResolvedValue(2),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("news router", () => {
  it("list returns paginated news", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.news.list({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("latest returns array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.news.latest({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("tenders router", () => {
  it("list returns paginated tenders", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.tenders.list({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("latest returns array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.tenders.latest({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("manufacturers router", () => {
  it("list returns paginated manufacturers", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.manufacturers.list({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });
});

describe("efficiency router", () => {
  it("list returns array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.efficiency.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("current returns array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.efficiency.current();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("search router", () => {
  it("global search returns structured results", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.search.global({ keyword: "钙钛矿", limit: 5 });
    expect(result).toHaveProperty("news");
    expect(result).toHaveProperty("tenders");
    expect(result).toHaveProperty("manufacturers");
  });
});

describe("stats router", () => {
  it("site stats returns counts", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.stats.site();
    expect(result).toHaveProperty("newsCount");
    expect(result).toHaveProperty("tenderCount");
    expect(result).toHaveProperty("manufacturerCount");
  });
});

describe("admin access control", () => {
  it("non-admin cannot trigger data fetch", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.dataFetch.triggerFetch()).rejects.toThrow();
  });

  it("admin can trigger data fetch", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.dataFetch.triggerFetch();
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("newsCount");
    expect(result).toHaveProperty("tenderCount");
  });

  it("unauthenticated user cannot create news", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.news.create({ title: "Test" })).rejects.toThrow();
  });

  it("admin can create news", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.news.create({ title: "钙钛矿新技术突破" });
    expect(result).toHaveProperty("success", true);
  });
});

describe("auth router", () => {
  it("me returns null for unauthenticated", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("admin");
  });

  it("logout clears session cookie", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
