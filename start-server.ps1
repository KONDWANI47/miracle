# MIRACLE ECD Website Server
Write-Host "Starting MIRACLE ECD Website Server..." -ForegroundColor Green
Write-Host ""
Write-Host "Website will be available at: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Admin panel: http://localhost:8000/admin.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

# Start HTTP server using PowerShell
$Hso = New-Object Net.HttpListener
$Hso.Prefixes.Add("http://localhost:8000/")
$Hso.Start()

Write-Host "Server started successfully!" -ForegroundColor Green

try {
    while ($Hso.IsListening) {
        $HC = $Hso.GetContext()
        $HRes = $HC.Response
        $HRes.Headers.Add("Content-Type","text/html")
        $Buf = [Text.Encoding]::UTF8.GetBytes((Get-Content $HC.Request.RawUrl.Substring(1) -Raw))
        $HRes.ContentLength64 = $Buf.Length
        $HRes.OutputStream.Write($Buf,0,$Buf.Length)
        $HRes.Close()
    }
}
finally {
    $Hso.Stop()
} 