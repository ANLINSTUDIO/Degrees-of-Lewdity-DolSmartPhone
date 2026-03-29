import json
import zipfile
from pathlib import Path

def collect_images(photo_dir, base_dir):
    """递归收集 img/photo 目录下所有文件的相对路径（相对于 base_dir）"""
    img_files = []
    photo_path = Path(photo_dir)
    base_path = Path(base_dir)
    
    if not photo_path.exists():
        print(f"警告: {photo_dir} 目录不存在")
        return img_files
    
    for file_path in photo_path.rglob('*'):
        if file_path.is_file():
            # 获取相对于 base_dir 的相对路径，并使用正斜杠
            rel_path = str(file_path.relative_to(base_path)).replace('\\', '/')
            img_files.append(rel_path)
    
    # 排序以保持一致性
    img_files.sort()
    return img_files

def update_boot_json(boot_json_path, img_files):
    """更新 boot.json 中的 imgFileList"""
    try:
        with open(boot_json_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # 替换 imgFileList
        config['imgFileList'] = img_files
        
        # 写回文件，保持格式
        with open(boot_json_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
        
        print(f"已更新 {boot_json_path}，共 {len(img_files)} 个图片文件")
        return config
    except Exception as e:
        print(f"更新 boot.json 失败: {e}")
        raise

def create_zip(zip_name, base_dir, files_to_pack):
    """将指定文件打包为 ZIP，保持目录结构"""
    try:
        with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for item in files_to_pack:
                item_path = Path(item)
                if item_path.exists():
                    if item_path.is_dir():
                        # 如果是目录，递归添加所有文件
                        for file_path in item_path.rglob('*'):
                            if file_path.is_file():
                                # 保持相对于 base_dir 的路径结构
                                arcname = str(file_path.relative_to(base_dir)).replace('\\', '/')
                                zipf.write(file_path, arcname)
                                print(f"已添加: {arcname}")
                    else:
                        # 如果是文件，直接添加到根目录
                        arcname = item_path.name
                        zipf.write(item_path, arcname)
                        print(f"已添加: {arcname}")
                else:
                    print(f"警告: 文件/目录不存在 - {item}")
        
        print(f"\n打包完成: {zip_name}")
    except Exception as e:
        print(f"打包 ZIP 失败: {e}")
        raise

def main():
    # 设置路径（假设脚本与这些文件在同一目录）
    base_dir = Path(__file__).parent
    boot_json_path = base_dir / "boot.json"
    js_file_path = base_dir / "smartphonephotopack.js"
    photo_dir = base_dir / "img" / "photo"
    img_dir = base_dir / "img"
    
    # 检查必要文件是否存在
    if not boot_json_path.exists():
        print("错误: boot.json 不存在")
        return
    
    if not js_file_path.exists():
        print("警告: smartphonephotopack.js 不存在，仍将继续打包")
    
    # 1. 收集图片文件（使用相对路径）
    img_files = collect_images(photo_dir, base_dir)
    
    # 2. 更新 boot.json
    config = update_boot_json(boot_json_path, img_files)
    
    # 3. 获取版本号用于 ZIP 文件名
    version = config.get('version', 'unknown')
    zip_name = f"DoL-SmartPhone-PhotoPack-{version}.zip"
    
    # 4. 打包文件
    files_to_pack = [boot_json_path, js_file_path, img_dir]
    create_zip(zip_name, base_dir, files_to_pack)
    
    print("\n完成！")

if __name__ == "__main__":
    main()
    input()
