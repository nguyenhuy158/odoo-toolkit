# Odoo Dev Toolkit — Feature Roadmap

Theo dõi trạng thái các tool trong panel. Cập nhật cột **Status** khi làm.

**Legend:** ✅ Done · 🚧 In progress · 📋 Planned · 💡 Idea / chưa chốt

## Đã có (baseline)

| Tool           | Status | Mô tả                                                                |
| -------------- | ------ | -------------------------------------------------------------------- |
| Field Detector | ✅     | Bắt field thiếu trong `get_views` trước khi client crash.            |
| noupdate       | ✅     | Đọc / toggle `ir.model.data.noupdate` theo XML ID hoặc model+res_id. |

---

## Phase 1 — Inspector core (tận dụng sẵn interceptor + `callKw`)

> Mục tiêu: biến panel thành "DevTools cho Odoo". Ưu tiên cao, ROI tốt.

| #   | Feature           | Status | Ghi chú                                                                                        |
| --- | ----------------- | ------ | ---------------------------------------------------------------------------------------------- |
| 1   | RPC Inspector     | 📋     | Log mọi `call_kw`: model, method, args, thời gian (ms), size. Filter theo model, copy-as-curl. |
| 2   | Model Browser     | 📋     | Nhập model → `fields_get`: name, type, required, relation. Bổ trợ Field Detector.              |
| 3   | Quick search_read | 📋     | Ô domain + model → `search_read` nhanh, export JSON (tái dùng export sẵn).                     |

## Phase 2 — On-page inspector & năng suất

> Cần tương tác với DOM của Odoo / nhiều RPC hơn.

| #   | Feature               | Status | Ghi chú                                                                   |
| --- | --------------------- | ------ | ------------------------------------------------------------------------- |
| 4   | View Inspector        | 💡     | Click field trên màn hình → field name, type, model, widget, view XML ID. |
| 5   | XML ID lookup mở rộng | 💡     | Reverse record → XML ID, nút "Open record" / "Open form view".            |
| 6   | Context viewer        | 💡     | Hiện uid, company, lang, tz, groups; switch company nhanh.                |
| 7   | Cache / assets reset  | 💡     | Nút regenerate assets — hay dùng khi dev.                                 |

## Phase 3 — Mở rộng & polish

> Cải thiện UX và bền vững cấu hình.

| #   | Feature                             | Status | Ghi chú                                                                        |
| --- | ----------------------------------- | ------ | ------------------------------------------------------------------------------ |
| 8   | Field Detector: group/filter/search | 💡     | Nhóm theo model/view, search box, "Open offending view".                       |
| 9   | Settings tab                        | 💡     | Bật/tắt từng detector, whitelist field, chọn instance (thay sửa manifest tay). |
| 10  | Persist state (`chrome.storage`)    | 💡     | Giữ problems + cấu hình khi reload tab.                                        |
| 11  | Translation finder                  | 💡     | Bắt string chưa dịch trên view hiện tại.                                       |

---

## Phase 4 — Debug & error intelligence

> Tận dụng interceptor để bắt lỗi runtime, không chỉ field thiếu.

| #   | Feature              | Status | Ghi chú                                                                                                       |
| --- | -------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| 12  | RPC Error catcher    | 💡     | Bắt mọi response có `error` (traceback Python) → hiển thị gọn, nút "Copy traceback", link tới model/method.   |
| 13  | Slow RPC profiler    | 💡     | Cảnh báo `call_kw` > ngưỡng (vd 500ms); bảng top-N method chậm nhất trong phiên. Mở rộng từ RPC Inspector.    |
| 14  | N+1 / duplicate RPC  | 💡     | Phát hiện cùng `(model, method, args)` gọi lặp nhiều lần liên tiếp — dấu hiệu vòng lặp ORM phía client.       |
| 15  | Deprecation watcher  | 💡     | Bắt warning trong response (`_deprecation`, attrs cũ) và API gọi method bị xoá ở version mới.                 |

## Phase 5 — Data & record tools

> Thao tác record nhanh khi dev/QA, đều qua `callKw` same-origin.

| #   | Feature                  | Status | Ghi chú                                                                                                        |
| --- | ------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| 16  | Record inspector         | 💡     | Nhập model+id → `read` full field (kể cả field ẩn), hiện raw value, copy JSON. Bổ trợ noupdate/XML ID lookup.  |
| 17  | Field value editor       | 💡     | Sửa nhanh 1 field của record qua `write` (có confirm) — vá data lúc dev không cần mở form.                     |
| 18  | Access rights checker     | 💡     | `check_access_rights` + đọc `ir.model.access` / record rules áp lên model cho user hiện tại.                   |
| 19  | Onchange tester          | 💡     | Gọi `onchange` với giá trị nhập tay → xem field nào đổi, debug logic onchange.                                 |
| 20  | Compute / recompute      | 💡     | Trigger `_compute`/`flush` qua method an toàn; hữu ích khi stored compute lệch.                                |

## Phase 6 — Frontend / view authoring

> Hỗ trợ người viết XML view & QWeb.

| #   | Feature              | Status | Ghi chú                                                                                                 |
| --- | -------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| 21  | View arch viewer     | 💡     | Hiện arch đã merge của view hiện tại (từ `get_views` interceptor đã có) + tô màu, copy XML.             |
| 22  | Widget catalog       | 💡     | Liệt kê widget khả dụng + field type tương thích — tra cứu nhanh khi viết view.                         |
| 23  | QWeb / report debug  | 💡     | Link nhanh tới `?debug=1`, mở report PDF/HTML, xem template id đang render.                              |
| 24  | Studio diff          | 💡     | So sánh view gốc vs view bị Studio/inherit ghi đè, highlight node thêm/bớt.                             |

## Phase 7 — Productivity & navigation

> Tiện ích đời thường cho dev Odoo.

| #   | Feature                 | Status | Ghi chú                                                                                              |
| --- | ----------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| 25  | Debug mode toggle       | 💡     | Bật/tắt `?debug=1` / `?debug=assets` ngay trên panel, nhớ lựa chọn theo instance.                    |
| 26  | Quick action launcher   | 💡     | Gõ tên model → mở list/form; jump tới Settings > Technical nhanh (command palette kiểu Ctrl+K).      |
| 27  | Session / env info      | 💡     | uid, login, company, lang, tz, db name, Odoo version, danh sách module cài (gộp với Context viewer). |
| 28  | Menu / action XML ID    | 💡     | Hiện XML ID của menu/action đang mở để copy vào code.                                                |
| 29  | Server actions runner   | 💡     | Liệt kê & chạy `ir.actions.server` trên record hiện tại (có confirm).                                |

## Phase 8 — Quality of life

> Polish panel & chia sẻ kết quả.

| #   | Feature                 | Status | Ghi chú                                                                                  |
| --- | ----------------------- | ------ | ---------------------------------------------------------------------------------------- |
| 30  | Export / share report   | 💡     | Xuất toàn bộ findings (field + RPC error) ra JSON/Markdown để dán vào issue.             |
| 31  | Keyboard shortcuts      | 💡     | Mở/đóng panel, chuyển tab, focus search bằng phím tắt.                                   |
| 32  | Dark mode / theme       | 💡     | Theo `prefers-color-scheme`, đồng bộ với theme Odoo.                                     |
| 33  | Panel layout            | 💡     | Kéo-thả vị trí, resize, dock trái/phải, nhớ vị trí qua `chrome.storage`.                 |
| 34  | Multi-instance presets  | 💡     | Lưu cấu hình riêng theo host (prod cảnh báo đỏ, dev/staging màu khác).                   |

---

## Cách cập nhật

1. Khi bắt đầu 1 feature: đổi Status sang 🚧, ghi tên branch/PR vào cột Ghi chú.
2. Khi merge: đổi sang ✅.
3. Thêm tool mới → đăng ký 1 tab trong `ui.js` (`data-tab`) và mục tương ứng ở đây.
