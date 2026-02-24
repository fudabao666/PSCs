import { invokeLLM } from "./_core/llm";
import { insertNews, insertTender } from "./db";

/**
 * Fetches latest perovskite photovoltaic industry news using LLM
 * with built-in knowledge and web search simulation.
 * Returns the number of items inserted.
 */
export async function fetchLatestNews(): Promise<number> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是一位专业的钙钛矿光伏行业资讯编辑。请根据你的知识，生成5条最近的钙钛矿光伏行业新闻摘要（可以是近期真实发生的行业动态）。
以JSON数组格式返回，每条包含：title（标题）、summary（100字摘要）、sourceName（来源名称）、category（domestic/international/research/policy/market/technology之一）、isImportant（boolean）。`,
        },
        {
          role: "user",
          content: `请生成${today}前后的钙钛矿光伏行业最新资讯，重点关注：效率突破、量产进展、政策动态、企业融资、国际合作等方向。`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "news_list",
          strict: true,
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    summary: { type: "string" },
                    sourceName: { type: "string" },
                    category: { type: "string" },
                    isImportant: { type: "boolean" },
                  },
                  required: ["title", "summary", "sourceName", "category", "isImportant"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : null;
    if (!content) return 0;

    const parsed = JSON.parse(content) as {
      items: Array<{
        title: string;
        summary: string;
        sourceName: string;
        category: string;
        isImportant: boolean;
      }>;
    };

    let count = 0;
    for (const item of parsed.items) {
      try {
        await insertNews({
          title: item.title,
          summary: item.summary,
          sourceName: item.sourceName,
          category: item.category as any,
          isImportant: item.isImportant,
          publishedAt: new Date(),
        });
        count++;
      } catch {
        // Skip duplicates or errors
      }
    }
    return count;
  } catch (err) {
    console.error("[dataFetcher] fetchLatestNews error:", err);
    return 0;
  }
}

/**
 * Fetches latest perovskite photovoltaic tender information using LLM.
 * Returns the number of items inserted.
 */
export async function fetchLatestTenders(): Promise<number> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是一位专业的钙钛矿光伏行业招投标信息编辑。请根据你的知识，生成3条最近的钙钛矿光伏行业招投标信息（可以是近期真实发生的项目）。
以JSON数组格式返回，每条包含：title（标题）、description（项目描述100字）、projectType（procurement/construction/research/service/other之一）、budget（预算金额，如"5000万元"）、region（地区）、publisherName（招标方名称）、isImportant（boolean）。`,
        },
        {
          role: "user",
          content: `请生成${today}前后的钙钛矿光伏行业招投标信息，重点关注：设备采购、EPC工程、研发合作、材料供应等方向。`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tender_list",
          strict: true,
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    projectType: { type: "string" },
                    budget: { type: "string" },
                    region: { type: "string" },
                    publisherName: { type: "string" },
                    isImportant: { type: "boolean" },
                  },
                  required: ["title", "description", "projectType", "budget", "region", "publisherName", "isImportant"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : null;
    if (!content) return 0;

    const parsed = JSON.parse(content) as {
      items: Array<{
        title: string;
        description: string;
        projectType: string;
        budget: string;
        region: string;
        publisherName: string;
        isImportant: boolean;
      }>;
    };

    let count = 0;
    for (const item of parsed.items) {
      try {
        await insertTender({
          title: item.title,
          description: item.description,
          projectType: item.projectType as any,
          budget: item.budget,
          region: item.region,
          publisherName: item.publisherName,
          isImportant: item.isImportant,
          status: "open",
          publishedAt: new Date(),
        });
        count++;
      } catch {
        // Skip duplicates or errors
      }
    }
    return count;
  } catch (err) {
    console.error("[dataFetcher] fetchLatestTenders error:", err);
    return 0;
  }
}
