---
description: "สร้าง learning map จาก insights ที่เก็บไว้ — ดูว่า session นี้เรียนอะไรไปบ้าง"
---

# /learning-map

สรุป insights จาก session ปัจจุบันเป็น learning map ที่อ่านเข้าใจง่าย

## Trigger

- User ถาม: "เรียนอะไรไปบ้าง", "สรุป session นี้", "ดู learning progress"
- User เรียก `/learning-map`
- อัตโนมัติตอน session end (ถ้าตั้งค่าไว้)

## Arguments

- `--full` — สร้าง full map จากทุก insight
- `--incremental` — เพิ่ม insight ใหม่ลง map เดิม
- `--view <view-id>` — แสดง view ที่สร้างไว้แล้ว

## Process

1. โหลด insights จาก `$LEARNING_MODE_HOME/insight-index.jsonl`
2. วิเคราะห์ connections ระหว่าง insights
3. สร้าง nodes (insights) + edges (relationships)
4. เขียน learning map เป็น Obsidian Markdown
5. บันทึกลง `$LEARNING_MODE_HOME/session-maps/<project-id>-<date>.json`
