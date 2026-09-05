// schedule — host half (minimal / safe no-op).
//
// The three floating desktop cards (每日时间安排 / 目标设置 / 日期规划) are rendered
// entirely in the browser half (client.js) via vanilla DOM, so the host half only
// needs to register as a cordis bundle WITHOUT throwing. A throwing host half would
// abort the entire plugin tree ("plugin tree failed to load"), so we guard everything.
export const name = 'schedule';
export const inject = [];

let started = false;

export function apply(ctx) {
  if (started) return;
  started = true;
  try {
    console.log('[schedule] host half ready (floating widgets live in client.js)');
  } catch (e) {
    /* never throw */
  }
  if (ctx && ctx.effect) {
    ctx.effect(() => () => {
      started = false;
    });
  }
}
