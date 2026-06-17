"""
inspect_spec_collector.py
검수 대상 노트북의 하드웨어 스펙을 수집하고 USB의 inspection_results/ 폴더에 JSON으로 저장.
PyInstaller로 단일 .exe 빌드 후 USB 루트에 복사해 사용.

빌드:
  pip install pyinstaller
  pyinstaller --onefile --windowed --name inspect_spec_collector collect_specs.py
"""

import json
import os
import sys
import subprocess
import tkinter as tk
from tkinter import messagebox
from datetime import datetime


def ps(command: str) -> str:
    """PowerShell 명령을 실행하고 결과 문자열을 반환."""
    result = subprocess.run(
        ['powershell', '-NonInteractive', '-NoProfile', '-Command', command],
        capture_output=True, text=True, timeout=30
    )
    return result.stdout.strip()


def collect_manufacturer() -> str:
    return ps("(Get-CimInstance Win32_ComputerSystem).Manufacturer")


def collect_model() -> str:
    return ps("(Get-CimInstance Win32_ComputerSystem).Model")


def collect_serial() -> str:
    return ps("(Get-CimInstance Win32_BIOS).SerialNumber")


def collect_cpu() -> str:
    raw = ps("(Get-CimInstance Win32_Processor | Select-Object -First 1).Name")
    # "Intel(R) Core(TM) i5-1135G7 @ 2.40GHz" → "i5-1135G7"
    import re
    m = re.search(r'(i[3579]-\w+|Core Ultra \d+ \d+|Ryzen \d+ \w+|Celeron \w+|Pentium \w+|M\d)', raw, re.IGNORECASE)
    return m.group(0) if m else raw


def collect_ram() -> str:
    return ps(r"""
$sticks = Get-CimInstance Win32_PhysicalMemory
$totalGB = [math]::Round(($sticks | Measure-Object -Property Capacity -Sum).Sum / 1GB)
$typeNum = if ($sticks) { $sticks[0].SMBIOSMemoryType } else { 0 }
$typeName = switch ($typeNum) {
    34 { 'DDR5' }
    26 { 'DDR4' }
    24 { 'DDR3' }
    29 { 'LPDDR4' }
    30 { 'LPDDR4X' }
    35 { 'LPDDR5' }
    default { 'DDR4' }
}
$raw = if ($sticks) { $sticks[0].Manufacturer } else { '' }
$mfr = switch -Regex ($raw) {
    'Samsung'           { 'Samsung' }
    'SK\s?Hynix|Hynix'  { 'SK Hynix' }
    'Micron|MT'         { 'Micron' }
    'Kingston'          { 'Kingston' }
    'Crucial'           { 'Crucial' }
    'G\.Skill|G-Skill'  { 'G.Skill' }
    'Corsair'           { 'Corsair' }
    default             { $raw.Trim() }
}
$clock = if ($sticks) { $sticks[0].ConfiguredClockSpeed } else { 0 }
if (-not $clock -or $clock -eq 0) { $clock = if ($sticks) { $sticks[0].Speed } else { 0 } }
$clockStr = if ($clock -gt 0) { " ${clock}MHz" } else { '' }
$mfrStr = if ($mfr) { "$mfr " } else { '' }
$ff = if ($sticks) { $sticks[0].FormFactor } else { 0 }
$slotType = if ($typeNum -in @(29,30,35)) { '온보드' }
            elseif ($ff -eq 12 -or $ff -eq 8) { '탈착식' }
            elseif ($ff -eq 0) { '온보드(추정)' }
            else { '탈착식' }
"${mfrStr}${totalGB}GB $typeName${clockStr} ($slotType)"
""")


def collect_storage() -> str:
    return ps(r"""
try {
    # USB·가상·미확인 드라이브 제외 — MediaType이 SSD 또는 HDD인 실물 디스크만
    $disks = Get-PhysicalDisk |
        Where-Object {
            $_.BusType -ne 7 -and $_.BusType -ne 'USB' -and
            $_.Size -gt 1GB -and
            ($_.MediaType -eq 'SSD' -or $_.MediaType -eq 'HDD')
        } |
        Sort-Object Size -Descending

    $results = foreach ($disk in $disks) {
        $sizeGB  = [math]::Round($disk.Size / 1GB)
        $model   = $disk.Model
        $btVal   = "$($disk.BusType)"

        # 인터페이스·폼팩터 판별 — BusType 우선, 모델명은 보조
        $isNvme  = $btVal -eq '17' -or $btVal -match 'NVMe'
        $isHdd   = $disk.MediaType -eq 'HDD'
        # M.2 SATA: SATA 버스이면서 모델명에 M.2/mSATA 명시된 경우만
        $isM2Sat = (-not $isNvme) -and (-not $isHdd) -and ($model -match 'M\.2 SATA|mSATA|M2 SATA')

        $type = if ($isHdd)   { 'HDD' }
                elseif ($isNvme)  { 'M.2 NVMe' }
                elseif ($isM2Sat) { 'M.2 SATA' }
                else              { 'SATA SSD' }

        # 제조사
        $mfr = $disk.Manufacturer
        if (-not $mfr -or $mfr -match '^\s*$') {
            $mfr = switch -Regex ($model) {
                'Samsung'             { 'Samsung' }
                'SK\s?Hynix|Hynix'    { 'SK Hynix' }
                'WD|Western.?Digital' { 'WD' }
                'Micron|Crucial|MT'   { 'Micron' }
                'Intel'               { 'Intel' }
                'Toshiba|KIOXIA'      { 'KIOXIA' }
                'Seagate|Barracuda'   { 'Seagate' }
                'HGST|Hitachi'        { 'HGST' }
                'SanDisk'             { 'SanDisk' }
                'Kingston'            { 'Kingston' }
                'ADATA'               { 'ADATA' }
                default               { '' }
            }
        }
        $mfrStr = if ($mfr.Trim()) { "$($mfr.Trim()) " } else { '' }
        "${mfrStr}${sizeGB}GB $type"
    }
    $results -join ' / '
} catch { '불명' }
""")


def collect_vga() -> str:
    return ps(r"""
$gpus = Get-CimInstance Win32_VideoController |
    Where-Object { $_.Name -notmatch 'Microsoft|Remote|Basic' } |
    Select-Object -ExpandProperty Name
($gpus -join ' / ').Trim()
""")


def collect_resolution() -> str:
    return ps(r"""
$v = Get-CimInstance Win32_VideoController |
    Where-Object { $_.CurrentHorizontalResolution -gt 0 } |
    Select-Object -First 1
if ($v) { "$($v.CurrentHorizontalResolution)x$($v.CurrentVerticalResolution)" } else { '불명' }
""")


def collect_battery() -> tuple[float, int]:
    """(health_pct, cycle_count) 반환. 측정 불가 시 (-1.0, 0)."""
    import re as _re
    import tempfile

    # 1순위: root\wmi BatteryStaticData
    raw = ps(r"""
try {
    $static = Get-CimInstance -Namespace root\wmi -ClassName BatteryStaticData -ErrorAction Stop
    $full   = Get-CimInstance -Namespace root\wmi -ClassName BatteryFullChargedCapacity -ErrorAction Stop
    $cycle  = Get-CimInstance -Namespace root\wmi -ClassName BatteryCycleCount -ErrorAction Stop
    $design  = $static[0].DesignedCapacity
    $current = $full[0].FullChargedCapacity
    $c       = $cycle[0].CycleCount
    if ($design -gt 0) {
        $pct = [math]::Round($current / $design * 100, 1)
        "$pct|$c"
    } else { 'fail' }
} catch { 'fail' }
""")
    if raw.strip() != 'fail':
        try:
            parts = raw.strip().split('|')
            return float(parts[0]), int(parts[1])
        except Exception:
            pass

    # 2순위: powercfg /batteryreport HTML 파싱
    try:
        report_path = os.path.join(tempfile.gettempdir(), 'batt_diag_report.html')
        subprocess.run(
            ['powercfg', '/batteryreport', '/output', report_path],
            capture_output=True, timeout=30
        )
        with open(report_path, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()
        design_m = _re.search(r'DESIGN CAPACITY[^<]*<[^>]+>[^<]*<[^>]+>([\d,]+)\s*mWh', html, _re.IGNORECASE)
        full_m   = _re.search(r'FULL CHARGE CAPACITY[^<]*<[^>]+>[^<]*<[^>]+>([\d,]+)\s*mWh', html, _re.IGNORECASE)
        if not design_m:
            design_m = _re.search(r'DESIGN CAPACITY.*?([\d,]+)\s*mWh', html, _re.IGNORECASE | _re.DOTALL)
        if not full_m:
            full_m = _re.search(r'FULL CHARGE CAPACITY.*?([\d,]+)\s*mWh', html, _re.IGNORECASE | _re.DOTALL)
        if design_m and full_m:
            design = int(design_m.group(1).replace(',', ''))
            full   = int(full_m.group(1).replace(',', ''))
            if design > 0:
                pct = round(full / design * 100, 1)
                return pct, 0
    except Exception:
        pass

    # 3순위: Win32_Battery 폴백
    raw2 = ps(r"""
try {
    $b = Get-CimInstance Win32_Battery -ErrorAction Stop | Select-Object -First 1
    if ($b -and $b.DesignCapacity -gt 0 -and $b.FullChargeCapacity -gt 0) {
        $pct = [math]::Round($b.FullChargeCapacity / $b.DesignCapacity * 100, 1)
        "$pct|0"
    } else { 'fail' }
} catch { 'fail' }
""")
    if raw2.strip() != 'fail':
        try:
            parts = raw2.strip().split('|')
            return float(parts[0]), int(parts[1])
        except Exception:
            pass

    return -1.0, 0


def collect_disk_health() -> tuple[str, bool]:
    """(health_label, has_bad_sector) 반환."""
    health_raw = ps(r"""
try {
    $disk = Get-PhysicalDisk | Sort-Object Size -Descending | Select-Object -First 1
    switch ($disk.HealthStatus) {
        'Healthy'   { '정상' }
        'Warning'   { '주의' }
        'Unhealthy' { '불량' }
        default     { '정상' }
    }
} catch { '정상' }
""")

    bad_raw = ps(r"""
try {
    $status = (Get-WmiObject Win32_DiskDrive | Select-Object -First 1).Status
    ($status -ne 'OK').ToString().ToLower()
} catch { 'false' }
""")

    health = health_raw.strip() or '정상'
    bad_sector = bad_raw.strip().lower() == 'true'
    return health, bad_sector


def get_output_dir() -> str:
    """exe(또는 스크립트) 위치 기준 inspection_results 폴더 경로."""
    if getattr(sys, 'frozen', False):
        base = os.path.dirname(sys.executable)
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    folder = os.path.join(base, 'inspection_results')
    os.makedirs(folder, exist_ok=True)
    return folder


def main():
    root = tk.Tk()
    root.withdraw()

    # 수집 시작 안내
    messagebox.showinfo("진단 시작", "하드웨어 스펙을 수집합니다.\n잠시 기다려주세요 (약 15~30초)...")

    try:
        manufacturer = collect_manufacturer()
        model        = collect_model()
        serial       = collect_serial()
        cpu          = collect_cpu()
        ram          = collect_ram()
        storage      = collect_storage()
        vga          = collect_vga()
        resolution   = collect_resolution()
        battery_pct, cycle_count = collect_battery()
        disk_health, bad_sector  = collect_disk_health()
    except Exception as e:
        messagebox.showerror("오류", f"스펙 수집 중 오류가 발생했습니다:\n{e}")
        return

    now = datetime.now()
    timestamp = now.strftime('%Y-%m-%dT%H:%M:%S')
    filename  = f"result_{now.strftime('%Y%m%d_%H%M%S')}.json"

    data = {
        "timestamp":          timestamp,
        "manufacturer":       manufacturer,
        "model":              model,
        "serial":             serial,
        "cpu":                cpu,
        "ram":                ram,
        "storage":            storage,
        "vga":                vga,
        "resolution":         resolution,
        "battery_health_pct": battery_pct,
        "battery_cycle_count": cycle_count,
        "disk_health":        disk_health,
        "disk_bad_sector":    bad_sector,
    }

    # 저장 전 확인 모달
    disk_warn = f"\n\n⚠ 디스크 헬스: {disk_health}" if disk_health != '정상' else ''
    bad_warn  = "\n⚠ 배드섹터 감지됨" if bad_sector else ''

    batt_str = f"{battery_pct}% (충전횟수: {cycle_count}회)" if battery_pct >= 0 else "측정불가 (관리자 권한 필요)"
    batt_warn = "\n⚠ 배터리 측정불가 — 관리자로 재실행 필요" if battery_pct < 0 else ''

    confirm_msg = (
        f"제조사:    {manufacturer}\n"
        f"모델명:    {model}\n"
        f"시리얼:    {serial}\n"
        f"CPU:       {cpu}\n"
        f"RAM:       {ram}\n"
        f"저장장치:  {storage}\n"
        f"VGA:       {vga}\n"
        f"해상도:    {resolution}\n"
        f"배터리:    {batt_str}\n"
        f"디스크:    {disk_health}"
        f"{bad_warn}"
        f"{batt_warn}"
        f"\n\n이 결과를 USB에 저장하시겠습니까?"
        f"{disk_warn}"
    )

    if not messagebox.askyesno("진단 완료 — 저장 확인", confirm_msg):
        messagebox.showinfo("취소", "저장이 취소되었습니다.")
        return

    output_dir  = get_output_dir()
    output_path = os.path.join(output_dir, filename)

    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        messagebox.showerror("저장 오류", f"파일 저장에 실패했습니다:\n{e}")
        return

    messagebox.showinfo(
        "저장 완료",
        f"저장됨: inspection_results/{filename}\n\n"
        "검수 화면으로 돌아가서 [자동 불러오기] 버튼을 클릭하고\n"
        "USB의 inspection_results 폴더에서 이 파일을 선택하세요."
    )


if __name__ == '__main__':
    main()
