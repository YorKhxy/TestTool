$excel = New-Object -ComObject Excel.Application
$excel.visible = $false
$workbook = $excel.Workbooks.Add()
$workbook.SaveAs("g:\apitester\TestPlan.xlsx", 51)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
Write-Host "Excel created successfully"
