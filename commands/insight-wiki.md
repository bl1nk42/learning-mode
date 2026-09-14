---
description: "สร้าง wiki จาก Learning Mode insights — เชื่อม insights ให้เป็นเรื่องราว"
---

# /insight-wiki

สร้าง wiki ที่อ่านเข้าใจง่ายจาก insights ที่เก็บไว้

## Trigger

- User ถาม: "สร้าง wiki เรื่อง...", "อยากดู insights เกี่ยวกับ..."
- User เรียก `/insight-wiki`

## Arguments

- หัวข้อหรือคำถามสำหรับ wiki (required)

## Process

1. โหลด insights จาก `$LEARNING_MODE_HOME/insight-index.jsonl`
2. เลือก insights ที่เกี่ยวข้องกับหัวข้อ
3. ตรวจสอบ evidence (`file:line`) ว่ายังใช้ได้
4. สร้าง connections ระหว่าง insights
5. เขียน wiki ด้วย Obsidian Markdown
6. บันทึกลง `$LEARNING_MODE_HOME/insight-wikis/<topic-slug>/`
