---
description: "สอน concept ใหม่ผ่าน teaching workspace แบบ multi-session"
---

# /teach

สอน user เรื่องใหม่ด้วย teaching workspace ที่เก็บ state ข้าม session

## Trigger

- User ถาม: "สอนเรื่อง...", "อยากเรียนรู้...", "ช่วยอธิบาย..."
- User เรียก `/teach`

## Arguments

- หัวข้อที่ต้องการเรียนรู้ (required)

## Process

1. สร้าง/โหลด teaching workspace ที่ `$LEARNING_MODE_HOME/teach`
2. สร้าง `MISSION.md` — ทำไมถึงอยากเรียนเรื่องนี้
3. สร้าง `RESOURCES.md` — แหล่งความรู้ที่เชื่อถือได้
4. สร้าง lessons แบบ step-by-step
5. บันทึก learning record เมื่อ user แสดงความเข้าใจ
