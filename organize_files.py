import os
import shutil
from pypdf import PdfReader
from docx import Document
import re

# Base directory for categorized files
BASE_DIR = "IPC"

def ensure_dirs():
    if not os.path.exists(BASE_DIR):
        os.makedirs(BASE_DIR)
    for m_type in ["CASA-300", "CASA-400", "Others"]:
        path = os.path.join(BASE_DIR, m_type)
        if not os.path.exists(path):
            os.makedirs(path)

def get_machine_type(file_path):
    try:
        # First check filename
        filename = os.path.basename(file_path).upper()
        if "CASA-300" in filename or "CASA300" in filename:
            return "CASA-300"
        if "CASA-400" in filename or "CASA400" in filename:
            return "CASA-400"
        
        # Then check content
        text = ""
        ext = file_path.lower().split('.')[-1]
        
        if ext == "pdf":
            reader = PdfReader(file_path)
            for page in reader.pages:
                try:
                    page_text = page.extract_text()
                    if page_text: text += page_text
                except: continue
        elif ext == "docx":
            doc = Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        
        text = text.upper()
        if "CASA-300" in text or "CASA 300" in text:
            return "CASA-300"
        if "CASA-400" in text or "CASA 400" in text:
            return "CASA-400"
        
        # Regex for CASA-300 or CASA-400
        match = re.search(r"CASA[- ]?(300|400)", text)
        if match:
            return f"CASA-{match.group(1)}"
            
        return "Others"
    except Exception as e:
        return "Others"

def organize():
    ensure_dirs()
    # Scan for PDF and DOCX
    files = [f for f in os.listdir('.') if f.lower().endswith(('.pdf', '.docx'))]
    
    moved_count = 0
    for filename in files:
        m_type = get_machine_type(filename)
        dest_dir = os.path.join(BASE_DIR, m_type)
        dest_path = os.path.join(dest_dir, filename)
        
        try:
            shutil.move(filename, dest_path)
            moved_count += 1
        except Exception as e:
            pass
            
    print(f"Organized {moved_count} files.")

if __name__ == "__main__":
    organize()
