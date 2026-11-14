#!/usr/bin/env python3
"""
Generuje kod QR jako plik PNG.
Użycie: python generate_qr.py "<url>" <output_path.png>

Wymaga: pip install qrcode[pil] --break-system-packages
"""
import sys

def main():
    if len(sys.argv) < 3:
        print("Użycie: python generate_qr.py <url> <output_path.png>")
        sys.exit(1)

    url = sys.argv[1]
    output_path = sys.argv[2]

    try:
        import qrcode
    except ImportError:
        print("Brak biblioteki 'qrcode'. Instaluję...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "qrcode[pil]", "--break-system-packages"])
        import qrcode

    img = qrcode.make(url)
    img.save(output_path)
    print(f"Zapisano kod QR do: {output_path}")

if __name__ == "__main__":
    main()
