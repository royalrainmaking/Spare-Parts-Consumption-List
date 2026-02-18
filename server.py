import os
import json
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

IPC_DIR = "IPC"

@app.route('/api/ipc-files')
def get_ipc_files():
    def get_dir_structure(path):
        structure = {"name": os.path.basename(path), "type": "folder", "children": []}
        try:
            items = os.listdir(path)
            for item in sorted(items):
                item_path = os.path.join(path, item)
                if os.path.isdir(item_path):
                    structure["children"].append(get_dir_structure(item_path))
                elif item.lower().endswith(('.pdf', '.docx')):
                    structure["children"].append({
                        "name": item,
                        "type": "file",
                        "path": os.path.relpath(item_path, IPC_DIR).replace('\\', '/')
                    })
        except Exception as e:
            print(f"Error reading {path}: {e}")
        return structure

    if not os.path.exists(IPC_DIR):
        return jsonify({"name": "IPC", "type": "folder", "children": []})
        
    full_structure = get_dir_structure(IPC_DIR)
    return jsonify(full_structure)

@app.route('/IPC/<path:filename>')
def serve_ipc(filename):
    return send_from_directory(IPC_DIR, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8888, debug=False)
