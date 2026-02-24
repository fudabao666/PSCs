/**
 * Daily scheduler for automatic data updates.
 * Runs at 08:00 CST (00:00 UTC) every day.
 */
import { fetchLatestNews, fetchLatestTenders } from "./dataFetcher";
import { createJobLog, updateJobLog } from "./db";
import { notifyOwner } from "./_core/notification";

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

function getNextRunDelay(): number {
  const now = new Date();
  // Target: 08:00 UTC+8 = 00:00 UTC
  const next = new Date(now);
  next.setUTCHours(0, 0, 0, 0);
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

async function runDailyUpdate() {
  console.log("[Scheduler] Starting daily data update...");
  const jobId = await createJobLog("scheduled_fetch");
  try {
    const [newsCount, tenderCount] = await Promise.all([
      fetchLatestNews(),
      fetchLatestTenders(),
    ]);
    const total = newsCount + tenderCount;
    if (jobId) await updateJobLog(jobId, "success", total);
    console.log(`[Scheduler] Daily update complete: ${newsCount} news, ${tenderCount} tenders`);

    if (total > 0) {
      await notifyOwner({
        title: "每日数据更新完成",
        content: `今日自动更新完成：新增行业资讯 ${newsCount} 条，招投标信息 ${tenderCount} 条。`,
      });
    }
  } catch (err) {
    console.error("[Scheduler] Daily update failed:", err);
    if (jobId) await updateJobLog(jobId, "failed", 0, String(err));
    await notifyOwner({
      title: "每日数据更新失败",
      content: `自动更新任务失败：${String(err)}`,
    }).catch(() => {});
  }
}

export function startScheduler() {
  const delay = getNextRunDelay();
  const hoursUntilNext = Math.round(delay / 1000 / 60 / 60 * 10) / 10;
  console.log(`[Scheduler] Next run in ${hoursUntilNext}h (daily at 08:00 CST)`);

  // First run at next 08:00 CST
  const timeout = setTimeout(async () => {
    await runDailyUpdate();
    // Then repeat every 24 hours
    schedulerInterval = setInterval(runDailyUpdate, 24 * 60 * 60 * 1000);
  }, delay);

  // Return cleanup function
  return () => {
    clearTimeout(timeout);
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }
  };
}
