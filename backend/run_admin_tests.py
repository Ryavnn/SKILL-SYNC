import subprocess
import os

test_file = r"c:\Users\ryani\Desktop\AI_DEV_WORKSPACE\Projects\SKILL-SYNC\backend\tests\test_admin_module.py"
python_exe = r".\env\Scripts\python.exe"

with open("test_output_admin.txt", "w") as f:
    process = subprocess.Popen(
        [python_exe, "-m", "pytest", "-v", test_file],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        cwd=r"c:\Users\ryani\Desktop\AI_DEV_WORKSPACE\Projects\SKILL-SYNC\backend"
    )
    for line in process.stdout:
        print(line, end="")
        f.write(line)
    process.wait()

print(f"\nTest finished with code {process.returncode}")
