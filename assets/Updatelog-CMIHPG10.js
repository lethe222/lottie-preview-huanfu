import { _ as m } from "./_plugin-vue_export-helper-DlAUqK2U.js";
import {
  r as u,
  a as e,
  d as t,
  F as l,
  k as c,
  o as s,
  b as a,
  t as n,
  y as p,
} from "./index-OfGLMNW8.js";
const h = { class: "update-log-page" },
  g = { class: "timeline-container" },
  L = { class: "version-meta" },
  k = { class: "version-number" },
  y = { class: "version-date" },
  N = { key: 0, class: "latest-tag" },
  f = { class: "timeline-axis" },
  B = { key: 0, class: "dot-inner" },
  b = { key: 0, class: "line" },
  S = { class: "content-card" },
  J = { class: "card-body" },
  O = { class: "log-list" },
  q = {
    __name: "Updatelog",
    setup(C) {
      const r = u([
        {
          version: "v1.5.0",
          date: "2026-02-02",
          items: ["🔨 修复复杂动画无法正常播放问题"],
        },
        {
          version: "v1.4.0",
          date: "2026-01-31",
          items: [
            "✨ 新增在线导入功能：支持通过 Lottie JSON 链接直接导入动画，方便快捷",
            "🔨 代码重构，结构更清晰",
            "✨ 优化截图功能：支持导出透明背景的 PNG 图片，不再强制填充预览背景色",
            "🎨 优化界面交互：资源列表背景色支持自定义配置",
            "📢 Bug反馈请发送到邮箱 3320653801@qq.com",
          ],
        },
        {
          version: "v1.3.0",
          date: "2026-01-05",
          items: [
            "🚀 新增 Lottie 文件优化功能：下载时自动移除冗余关键帧和精度优化",
            "🔧 修复 Lottie 兼容性问题：自动修复 to/ti 属性为 null 导致的崩溃问题",
            "📊 新增图片资源替换优化：替换图片时自动检测并移除冗余的矢量图层",
          ],
        },
        {
          version: "v1.2.0",
          date: "2025-12-18",
          items: [
            '💾 新增"保存当前帧"功能：支持将当前画面截图保存为 PNG',
            '📦 新增"导出所有图片"功能：一键批量导出 Lottie 中的所有图片资源',
            "📥 新增 Base64 Lottie 下载：支持将修改后的动画导出为 JSON 文件",
          ],
        },
        {
          version: "v1.1.0",
          date: "2025-12-12",
          items: [
            "🖼️ 支持 Lottie 图片资源替换：可以直接替换动画中的位图",
            "🎨 支持播放器背景颜色修改：方便预览不同背景下的动画效果",
            "ℹ️ 新增动画详细信息显示：包括尺寸、帧率、时长、文件大小等",
          ],
        },
        {
          version: "v1.0.0",
          date: "2025-12-01",
          items: [
            "🎉 项目初始化：Lottie 预览工具上线",
            "📂 支持拖拽上传 Base64 格式的 Lottie JSON 文件",
            "⏯️ 基础播放控制：播放/暂停、停止、重播、首帧、进度条拖拽",
          ],
        },
      ]);
      return (F, d) => (
        s(),
        e("div", h, [
          d[0] ||
            (d[0] = t(
              "div",
              { class: "page-header" },
              [
                t("h1", null, "更新日志"),
                t("p", { class: "subtitle" }, "我们在持续进行功能和体验升级,"),
              ],
              -1,
            )),
          t("div", g, [
            (s(!0),
            e(
              l,
              null,
              c(
                r.value,
                (i, o) => (
                  s(),
                  e("div", { key: o, class: "timeline-item" }, [
                    t("div", L, [
                      t("div", k, n(i.version), 1),
                      t("div", y, n(i.date), 1),
                      o === 0 ? (s(), e("div", N, "最新版")) : a("", !0),
                    ]),
                    t("div", f, [
                      t(
                        "div",
                        { class: p(["dot", { "current-dot": o === 0 }]) },
                        [o === 0 ? (s(), e("div", B)) : a("", !0)],
                        2,
                      ),
                      o !== r.value.length - 1 ? (s(), e("div", b)) : a("", !0),
                    ]),
                    t("div", S, [
                      t("div", J, [
                        t("ul", O, [
                          (s(!0),
                          e(
                            l,
                            null,
                            c(
                              i.items,
                              (_, v) => (s(), e("li", { key: v }, n(_), 1)),
                            ),
                            128,
                          )),
                        ]),
                      ]),
                    ]),
                  ])
                ),
              ),
              128,
            )),
          ]),
        ])
      );
    },
  },
  U = m(q, [["__scopeId", "data-v-00712521"]]);
export { U as default };
