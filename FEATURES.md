# Odoo Dev Toolkit — Feature Roadmap

Theo dõi trạng thái các tool trong panel. Cập nhật cột **Status** khi làm.

**Legend:** ✅ Done · 🚧 In progress · 📋 Planned · 💡 Idea / chưa chốt

## Đã có (baseline + shipped)

| Tool                 | Status | Mô tả                                                                              |
| -------------------- | ------ | ---------------------------------------------------------------------------------- |
| Field Detector       | ✅     | Bắt field thiếu trong `get_views`; toolbar filter/group + jump to arch/fields.     |
| noupdate             | ✅     | Đọc / toggle `ir.model.data.noupdate` + browse list theo module/model + tree view. |
| View arch inspector  | ✅     | Read `ir.ui.view.arch`, cross-check field refs vs `fields_get`, inline highlight.  |
| Domain tester        | ✅     | search_count + preview với domain python-ish, KPI elapsed.                         |
| ORM eval             | ✅     | Server action runner (state=code) với log/action capture, danger ack.              |
| i18n gaps            | ✅     | Diff translatable char/text/html giữa en_US vs target lang.                        |
| RPC Inspector        | ✅     | Capture fetch + XHR call_kw: timing, size, copy curl, filter status/method.        |
| Model Browser        | ✅     | `ir.model` list + `fields_get` grouped by type, required/store/RO flags.           |
| View Inspector       | ✅     | Picker mode click field trên page → name, widget, view type, model + jump.         |
| Context viewer       | ✅     | uid/company/lang/tz/groups, switch company, debug/assets/cache actions.            |
| Searchable lang/cmbo | ✅     | Generic `createCombo()` factory tái dùng (lang, company, action).                  |
| GH Actions runner    | ✅     | Sticky badge top-right trên `github.com/*/actions/runs/*` show runner/group/ver.   |

---

## Phase 1 — Inspector core (tận dụng sẵn interceptor + `callKw`)

> Mục tiêu: biến panel thành "DevTools cho Odoo". Ưu tiên cao, ROI tốt.

| #   | Feature           | Status | Ghi chú                                                                                       |
| --- | ----------------- | ------ | --------------------------------------------------------------------------------------------- |
| 1   | RPC Inspector     | ✅     | `rpc` tab. Capture cả fetch + XHR. Ring buffer 500. Pause/clear/export/copy-curl.             |
| 2   | Model Browser     | ✅     | `models` tab. Sidebar `ir.model` + per-field grouping + flags + search.                       |
| 3   | Quick search_read | ✅     | Implemented as Domain tester (`domain` tab). KPI: count, elapsed, preview limit configurable. |

## Phase 2 — On-page inspector & năng suất

> Cần tương tác với DOM của Odoo / nhiều RPC hơn.

| #   | Feature               | Status | Ghi chú                                                                                              |
| --- | --------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| 4   | View Inspector        | ✅     | `inspect` tab. Picker overlay (emerald), ESC cancels, capture name/widget/view/model/res_id + jumps. |
| 5   | XML ID lookup mở rộng | ✅     | Reverse model+res_id → XML ID đã có trong noupdate tab; picker jump wires res_id.                    |
| 6   | Context viewer        | ✅     | `ctx` tab. KPI strip + groups by category + company switcher (combo).                                |
| 7   | Cache / assets reset  | ✅     | Folded vào context tab "dev tools": debug=1/assets/off, regen-assets, clear ir.qweb caches.          |

## Phase 3 — Mở rộng & polish

> Cải thiện UX và bền vững cấu hình.

| #   | Feature                             | Status | Ghi chú                                                                        |
| --- | ----------------------------------- | ------ | ------------------------------------------------------------------------------ |
| 8   | Field Detector: group/filter/search | ✅     | Toolbar: filter q + cat seg + group (flat/model/view); per-row jump arch/flds. |
| 9   | Settings tab                        | 💡     | Bật/tắt từng detector, whitelist field, chọn instance (thay sửa manifest tay). |
| 10  | Persist state (`chrome.storage`)    | 💡     | Giữ problems + cấu hình khi reload tab.                                        |
| 11  | Translation finder                  | 💡     | Bắt string chưa dịch trên view hiện tại.                                       |

---

## Phase 4 — Debug & error intelligence

> Tận dụng interceptor để bắt lỗi runtime, không chỉ field thiếu.

| #   | Feature             | Status | Ghi chú                                                                                                     |
| --- | ------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| 12  | RPC Error catcher   | 💡     | Bắt mọi response có `error` (traceback Python) → hiển thị gọn, nút "Copy traceback", link tới model/method. |
| 13  | Slow RPC profiler   | 💡     | Cảnh báo `call_kw` > ngưỡng (vd 500ms); bảng top-N method chậm nhất trong phiên. Mở rộng từ RPC Inspector.  |
| 14  | N+1 / duplicate RPC | 💡     | Phát hiện cùng `(model, method, args)` gọi lặp nhiều lần liên tiếp — dấu hiệu vòng lặp ORM phía client.     |
| 15  | Deprecation watcher | 💡     | Bắt warning trong response (`_deprecation`, attrs cũ) và API gọi method bị xoá ở version mới.               |

## Phase 5 — Data & record tools

> Thao tác record nhanh khi dev/QA, đều qua `callKw` same-origin.

| #   | Feature               | Status | Ghi chú                                                                                                       |
| --- | --------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| 16  | Record inspector      | 💡     | Nhập model+id → `read` full field (kể cả field ẩn), hiện raw value, copy JSON. Bổ trợ noupdate/XML ID lookup. |
| 17  | Field value editor    | 💡     | Sửa nhanh 1 field của record qua `write` (có confirm) — vá data lúc dev không cần mở form.                    |
| 18  | Access rights checker | 💡     | `check_access_rights` + đọc `ir.model.access` / record rules áp lên model cho user hiện tại.                  |
| 19  | Onchange tester       | 💡     | Gọi `onchange` với giá trị nhập tay → xem field nào đổi, debug logic onchange.                                |
| 20  | Compute / recompute   | 💡     | Trigger `_compute`/`flush` qua method an toàn; hữu ích khi stored compute lệch.                               |

## Phase 6 — Frontend / view authoring

> Hỗ trợ người viết XML view & QWeb.

| #   | Feature             | Status | Ghi chú                                                                                     |
| --- | ------------------- | ------ | ------------------------------------------------------------------------------------------- |
| 21  | View arch viewer    | 💡     | Hiện arch đã merge của view hiện tại (từ `get_views` interceptor đã có) + tô màu, copy XML. |
| 22  | Widget catalog      | 💡     | Liệt kê widget khả dụng + field type tương thích — tra cứu nhanh khi viết view.             |
| 23  | QWeb / report debug | 💡     | Link nhanh tới `?debug=1`, mở report PDF/HTML, xem template id đang render.                 |
| 24  | Studio diff         | 💡     | So sánh view gốc vs view bị Studio/inherit ghi đè, highlight node thêm/bớt.                 |

## Phase 7 — Productivity & navigation

> Tiện ích đời thường cho dev Odoo.

| #   | Feature               | Status | Ghi chú                                                                                              |
| --- | --------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| 25  | Debug mode toggle     | 💡     | Bật/tắt `?debug=1` / `?debug=assets` ngay trên panel, nhớ lựa chọn theo instance.                    |
| 26  | Quick action launcher | 💡     | Gõ tên model → mở list/form; jump tới Settings > Technical nhanh (command palette kiểu Ctrl+K).      |
| 27  | Session / env info    | 💡     | uid, login, company, lang, tz, db name, Odoo version, danh sách module cài (gộp với Context viewer). |
| 28  | Menu / action XML ID  | 💡     | Hiện XML ID của menu/action đang mở để copy vào code.                                                |
| 29  | Server actions runner | 💡     | Liệt kê & chạy `ir.actions.server` trên record hiện tại (có confirm).                                |

## Phase 8 — Quality of life

> Polish panel & chia sẻ kết quả.

| #   | Feature                | Status | Ghi chú                                                                      |
| --- | ---------------------- | ------ | ---------------------------------------------------------------------------- |
| 30  | Export / share report  | 💡     | Xuất toàn bộ findings (field + RPC error) ra JSON/Markdown để dán vào issue. |
| 31  | Keyboard shortcuts     | 💡     | Mở/đóng panel, chuyển tab, focus search bằng phím tắt.                       |
| 32  | Dark mode / theme      | 💡     | Theo `prefers-color-scheme`, đồng bộ với theme Odoo.                         |
| 33  | Panel layout           | 💡     | Kéo-thả vị trí, resize, dock trái/phải, nhớ vị trí qua `chrome.storage`.     |
| 34  | Multi-instance presets | 💡     | Lưu cấu hình riêng theo host (prod cảnh báo đỏ, dev/staging màu khác).       |

---

## Cách cập nhật

1. Khi bắt đầu 1 feature: đổi Status sang 🚧, ghi tên branch/PR vào cột Ghi chú.
2. Khi merge: đổi sang ✅.
3. Thêm tool mới → đăng ký 1 tab trong `ui.js` (`data-tab`) và mục tương ứng ở đây.
