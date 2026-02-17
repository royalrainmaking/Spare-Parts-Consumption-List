import streamlit as st
import pandas as pd
from datetime import datetime

st.set_page_config(page_title="ระบบเบิกวัสดุอากาศยาน", layout="wide")

st.title("แบบฟอร์มรายการวัสดุอากาศยานใช้ในการตรวจซ่อมบำรุงอากาศยาน")

# Basic Information
col1, col2, col3 = st.columns(3)
with col1:
    location = st.text_input("สถานที่")
with col2:
    date = st.date_input("วันที่", datetime.now())
with col3:
    aircraft_type = st.text_input("แบบอากาศยาน")

col4, col5 = st.columns(2)
with col4:
    kaset_no = st.text_input("หมายเลขเกษตร")
with col5:
    reference = st.text_input("อ้างถึง")

# Repair Type
st.subheader("ประเภทการตรวจซ่อม")
repair_type = st.radio(
    "เลือกประเภทการตรวจซ่อม",
    ["ตรวจซ่อมพิเศษประจำปี", "ตรวจซ่อมตามระยะเวลา", "ตรวจซ่อมตามอาการ"],
    horizontal=True
)

if repair_type == "ตรวจซ่อมตามระยะเวลา":
    col_r1, col_r2 = st.columns(2)
    with col_r1:
        flight_hours = st.number_input("จำนวนชั่วโมงบิน", min_value=0.0, step=0.1)
    with col_r2:
        repair_round = st.text_input("ครั้งที่")

# Parts Table
st.subheader("รายการวัสดุ")

if 'items' not in st.session_state:
    st.session_state.items = [
        {"รายการ": "", "P/N": "", "S/N": "", "จำนวน (EA)": 1, "ราคาต่อหน่วย": 0.0, "หมายเหตุ": ""}
    ]

def add_item():
    st.session_state.items.append(
        {"รายการ": "", "P/N": "", "S/N": "", "จำนวน (EA)": 1, "ราคาต่อหน่วย": 0.0, "หมายเหตุ": ""}
    )

def remove_item(index):
    if len(st.session_state.items) > 1:
        st.session_state.items.pop(index)

# Display table
for i, item in enumerate(st.session_state.items):
    cols = st.columns([0.5, 3, 2, 2, 1, 1.5, 1.5, 2, 0.5])
    cols[0].write(f"{i+1}")
    st.session_state.items[i]["รายการ"] = cols[1].text_input(f"รายการ #{i+1}", value=item["รายการ"], label_visibility="collapsed")
    st.session_state.items[i]["P/N"] = cols[2].text_input(f"P/N #{i+1}", value=item["P/N"], label_visibility="collapsed")
    st.session_state.items[i]["S/N"] = cols[3].text_input(f"S/N #{i+1}", value=item["S/N"], label_visibility="collapsed")
    st.session_state.items[i]["จำนวน (EA)"] = cols[4].number_input(f"จำนวน #{i+1}", value=item["จำนวน (EA)"], min_value=1, label_visibility="collapsed")
    st.session_state.items[i]["ราคาต่อหน่วย"] = cols[5].number_input(f"ราคา/หน่วย #{i+1}", value=item["ราคาต่อหน่วย"], min_value=0.0, label_visibility="collapsed")
    
    total_price = st.session_state.items[i]["จำนวน (EA)"] * st.session_state.items[i]["ราคาต่อหน่วย"]
    cols[6].write(f"{total_price:,.2f}")
    
    st.session_state.items[i]["หมายเหตุ"] = cols[7].text_input(f"หมายเหตุ #{i+1}", value=item["หมายเหตุ"], label_visibility="collapsed")
    
    if cols[8].button("🗑️", key=f"remove_{i}"):
        remove_item(i)
        st.rerun()

st.button("➕ เพิ่มรายการ", on_click=add_item)

# Footer info
st.divider()
col_f1, col_f2 = st.columns(2)
with col_f1:
    operator = st.text_input("ผู้ปฏิบัติ")
    operator_rank = st.text_input("ยศ/ตำแหน่ง (ผู้ปฏิบัติ)")
with col_f2:
    supervisor = st.text_input("ผู้ควบคุม")
    supervisor_rank = st.text_input("ยศ/ตำแหน่ง (ผู้ควบคุม)")

if st.button("บันทึกข้อมูล"):
    with st.spinner("กำลังบันทึกข้อมูล..."):
        # Simulate saving delay
        import time
        time.sleep(1)
    st.success("บันทึกข้อมูลเรียบร้อยแล้ว (ยังไม่รองรับการส่งออกไฟล์ในขณะนี้)")
