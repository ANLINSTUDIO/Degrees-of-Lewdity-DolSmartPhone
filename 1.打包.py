import json
import zipfile
import time
import shutil
import subprocess
import tempfile
import os
from pathlib import Path

MOD_NAME = "SmartPhone"
IF_MINIFY = 0

def minify_js(file_path):
    """用 terser 压缩 JS（去注释去空白、缩短变量名），返回压缩后的文本；terser 不可用或压缩失败时返回 None，打包时退回原文件"""
    exe = shutil.which("terser")
    if not exe:
        print("提示: 未找到 terser（npm install -g terser），JS 按原样打包")
        return None
    try:
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as tf:
            tf.write(Path(file_path).read_text(encoding="utf-8"))
            tmp = tf.name
        try:
            r = subprocess.run([exe, tmp, "--compress", "--mangle", "--ecma", "2017"],
                               capture_output=True, text=True, encoding="utf-8", timeout=120)
            if r.returncode != 0 or not r.stdout.strip():
                print(f"警告: terser 压缩失败，按原样打包: {r.stderr.strip()[:200]}")
                return None
            before = len(Path(file_path).read_text(encoding="utf-8"))
            print(f"已压缩: {Path(file_path).name}  {before} -> {len(r.stdout)} 字符")
            return r.stdout
        finally:
            os.unlink(tmp)
    except Exception as e:
        print(f"警告: 压缩出错，按原样打包: {e}")
        return None

def minify_css(file_path):
    """压缩 CSS：去注释去空白（保留 data: URI 内的空格，不能动）。纯文本处理，无外部依赖；失败返回 None 退回原文件"""
    try:
        import re
        css = Path(file_path).read_text(encoding="utf-8")
        # 先摘出 url(...) 与引号字符串里的内容原样保护（data URI 里的空格/分号不可动）
        tokens = []
        def stash(m):
            tokens.append(m.group(0))
            return f"\x00{len(tokens) - 1}\x00"
        css = re.sub(r"url\([^)]*\)|\"[^\"]*\"|'[^']*'", stash, css)
        css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)          # 块注释
        css = re.sub(r"\s+", " ", css)                            # 连续空白压成单空格
        css = re.sub(r"\s*([{}:;,>~+])\s*", r"\1", css)           # 符号两侧空格去掉
        css = re.sub(r";}", "}", css)                             # 末尾分号
        css = css.strip()
        css = re.sub(r"\x00(\d+)\x00", lambda m: tokens[int(m.group(1))], css)   # 还原被保护的串
        print(f"已压缩: {Path(file_path).name}  {len(Path(file_path).read_text(encoding='utf-8'))} -> {len(css)} 字符")
        return css
    except Exception as e:
        print(f"警告: CSS 压缩出错，按原样打包: {e}")
        return None

def collect_images(photo_dir, base_dir):
    """递归收集目录下所有文件的相对路径（相对于 base_dir），目录不存在则返回空"""
    img_files = []
    photo_path = Path(photo_dir)
    base_path = Path(base_dir)

    if not photo_path.exists():
        print(f"提示: {photo_dir} 目录不存在，跳过")
        return img_files

    for file_path in photo_path.rglob('*'):
        if file_path.is_file():
            relative_path = file_path.relative_to(base_path)
            rel_path = str(relative_path).replace('\\', '/')
            img_files.append(rel_path)
            print(f"已添加图片: {relative_path}")

    img_files.sort()
    return img_files

def update_boot_json(boot_json_path, img_files):
    """更新 boot.json 中的 imgFileList"""
    try:
        with open(boot_json_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        config['imgFileList'] = img_files

        with open(boot_json_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)

        print(f"已更新boot.json ({boot_json_path})，共 {len(img_files)} 个图片文件")
        return config
    except Exception as e:
        print(f"更新 boot.json 失败: {e}")
        raise

def create_zip(zip_name, base_dir):
    """将 base_dir 目录下的所有内容打包为 ZIP，保持目录结构"""
    base_path = Path(base_dir)
    if not base_path.exists() or not base_path.is_dir():
        print(f"错误: 基准目录不存在或不是目录 - {base_dir}")
        return

    try:
        with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in base_path.rglob('*'):
                if file_path.is_file():
                    arcname = str(file_path.relative_to(base_path)).replace('\\', '/')
                    if IF_MINIFY:
                        if file_path.suffix.lower() == ".js":
                            if IF_MINIFY:
                                mini = minify_js(file_path)
                                if mini is not None:
                                    zipf.writestr(arcname, mini)   # 压缩后的 JS 写进 zip；源目录不动
                                    print(f"已添加(压缩): {arcname}")
                                    continue
                        elif file_path.suffix.lower() == ".css":
                            mini = minify_css(file_path)
                            if mini is not None:
                                zipf.writestr(arcname, mini)   # 压缩后的 CSS 写进 zip；源目录不动
                                print(f"已添加(压缩): {arcname}")
                                continue
                    zipf.write(file_path, arcname)
                    print(f"已添加: {arcname}")

        print(f"\n打包完成: {zip_name}")

    except Exception as e:
        print(f"打包 ZIP 失败: {e}")
        raise

def main():
    base_dir = Path(__file__).parent / "Source"
    boot_json_path = base_dir / "boot.json"
    img_dir = base_dir / "img"

    img_files = collect_images(img_dir, base_dir)

    config = update_boot_json(boot_json_path, img_files)

    print("="*50)
    version = config.get('version', 'unknown')
    zip_name = f"{MOD_NAME}-v{version}.mod.zip"
    print("version: ", version)
    print("filenam: ", zip_name)
    print("开始打包")
    print("="*50)

    create_zip(zip_name, base_dir)

    print("\n完成！")

if __name__ == "__main__":
    try:
        main()
        time.sleep(0.5)
    except Exception:
        print("="*50)
        import traceback
        traceback.print_exc()
        input()
