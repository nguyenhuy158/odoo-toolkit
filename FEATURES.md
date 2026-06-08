# Odoo Dev Toolkit — Feature Roadmap

Theo dõi trạng thái các tool trong panel. Cập nhật cột **Status** khi làm.

**Legend:** ✅ Done · 🚧 In progress · 📋 Planned · 💡 Idea / chưa chốt

## Đã có (baseline)

| Tool          | Status | Mô tả                                                              |
| ------------- | ------ | ------------------------------------------------------------------ |
| Field Detector | ✅     | Bắt field thiếu trong `get_views` trước khi client crash.          |
| noupdate       | ✅     | Đọc / toggle `ir.model.data.noupdate` theo XML ID hoặc model+res_id. |

---

## Phase 1 — Inspector core (tận dụng sẵn interceptor + `callKw`)

> Mục tiêu: biến panel thành "DevTools cho Odoo". Ưu tiên cao, ROI tốt.

| # | Feature            | Status | Ghi chú                                                                 |
| - | ------------------ | ------ | ----------------------------------------------------------------------- |
| 1 | RPC Inspector      | 📋     | Log mọi `call_kw`: model, method, args, thời gian (ms), size. Filter theo model, copy-as-curl. |
| 2 | Model Browser      | 📋     | Nhập model → `fields_get`: name, type, required, relation. Bổ trợ Field Detector. |
| 3 | Quick search_read  | 📋     | Ô domain + model → `search_read` nhanh, export JSON (tái dùng export sẵn). |

## Phase 2 — On-page inspector & năng suất

> Cần tương tác với DOM của Odoo / nhiều RPC hơn.

| # | Feature            | Status | Ghi chú                                                              |
| - | ------------------ | ------ | -------------------------------------------------------------------- |
| 4 | View Inspector     | 💡     | Click field trên màn hình → field name, type, model, widget, view XML ID. |
| 5 | XML ID lookup mở rộng | 💡  | Reverse record → XML ID, nút "Open record" / "Open form view".       |
| 6 | Context viewer     | 💡     | Hiện uid, company, lang, tz, groups; switch company nhanh.            |
| 7 | Cache / assets reset | 💡   | Nút regenerate assets — hay dùng khi dev.                            |

## Phase 3 — Mở rộng & polish

> Cải thiện UX và bền vững cấu hình.

| # | Feature                     | Status | Ghi chú                                                       |
| - | --------------------------- | ------ | ------------------------------------------------------------- |
| 8  | Field Detector: group/filter/search | 💡 | Nhóm theo model/view, search box, "Open offending view".     |
| 9  | Settings tab                | 💡     | Bật/tắt từng detector, whitelist field, chọn instance (thay sửa manifest tay). |
| 10 | Persist state (`chrome.storage`) | 💡 | Giữ problems + cấu hình khi reload tab.                       |
| 11 | Translation finder          | 💡     | Bắt string chưa dịch trên view hiện tại.                      |

---

## Cách cập nhật

1. Khi bắt đầu 1 feature: đổi Status sang 🚧, ghi tên branch/PR vào cột Ghi chú.
2. Khi merge: đổi sang ✅.
3. Thêm tool mới → đăng ký 1 tab trong `ui.js` (`data-tab`) và mục tương ứng ở đây.
