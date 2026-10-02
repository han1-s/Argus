param([int]$IntervalMilliseconds = 250, [int]$IdleTimeoutSeconds = 60, [switch]$Once)
$ErrorActionPreference = 'Stop'
$IntervalMilliseconds = [Math]::Max(100, [Math]::Min(1000, $IntervalMilliseconds))
$IdleTimeoutSeconds = [Math]::Max(10, [Math]::Min(600, $IdleTimeoutSeconds))

if (-not ('ArgusForegroundWatcher' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

public static class ArgusForegroundWatcher {
    [StructLayout(LayoutKind.Sequential)]
    private struct LastInputInfo {
        public uint Size;
        public uint Time;
    }

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr window, out uint processId);

    [DllImport("user32.dll")]
    private static extern bool GetLastInputInfo(ref LastInputInfo info);

    [DllImport("kernel32.dll")]
    private static extern uint GetTickCount();

    public static string GetState(uint idleTimeoutMilliseconds) {
        var input = new LastInputInfo();
        input.Size = (uint)Marshal.SizeOf(typeof(LastInputInfo));
        if (!GetLastInputInfo(ref input)) return "";
        var idleMilliseconds = unchecked(GetTickCount() - input.Time);
        if (idleMilliseconds >= idleTimeoutMilliseconds) return "";

        var window = GetForegroundWindow();
        if (window == IntPtr.Zero) return "";
        uint processId;
        GetWindowThreadProcessId(window, out processId);
        if (processId == 0 || processId == 4) return "";
        try {
            var process = Process.GetProcessById((int)processId);
            var name = process.ProcessName;
            if (String.IsNullOrWhiteSpace(name) || name == "LockApp" || name == "LogonUI") return "";
            return processId.ToString() + "\t" + name;
        } catch {
            return "";
        }
    }
}
'@
}

$idleTimeoutMilliseconds = [uint32]($IdleTimeoutSeconds * 1000)
while ($true) {
  try {
    $state = [ArgusForegroundWatcher]::GetState($idleTimeoutMilliseconds)
    if ($state) { [Console]::Out.WriteLine("FOCUS`t$state") }
    else { [Console]::Out.WriteLine('IDLE') }
    [Console]::Out.Flush()
  } catch {
    [Console]::Out.WriteLine('IDLE')
    [Console]::Out.Flush()
  }
  if ($Once) { break }
  Start-Sleep -Milliseconds $IntervalMilliseconds
}
