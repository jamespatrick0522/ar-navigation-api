param(
    [string]$UnityProject = 'D:\Unity Projects\AR Navigation App',
    [string]$UnityEditor = 'D:\Unity\Installs\6000.4.7f1\Editor'
)
$ErrorActionPreference = 'Stop'
[xml]$project = Get-Content -Raw -LiteralPath (Join-Path $UnityProject 'Assembly-CSharp.csproj')
$references = @($project.SelectNodes('//Reference/HintPath') | ForEach-Object {
    $path = $_.InnerText
    if (![IO.Path]::IsPathRooted($path)) { $path = Join-Path $UnityProject $path }
    if (Test-Path -LiteralPath $path) { $path }
})
$output = Join-Path ([IO.Path]::GetTempPath()) ('school-ar-checks-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $output | Out-Null
$dotnet = Join-Path $UnityEditor 'Data\NetCoreRuntime\dotnet.exe'
$compiler = Join-Path $UnityEditor 'Data\DotNetSdkRoslyn\csc.dll'
$runtimeSources = @(Get-ChildItem -LiteralPath (Join-Path $UnityProject 'Assets\Scripts') -Filter '*.cs' | ForEach-Object FullName)
$runtimeDll = Join-Path $output 'UnityNavigation.dll'
$runtimeArgs = @('/nologo', '/target:library', '/langversion:9.0', '/nostdlib+', '/nowarn:0649', ('/out:' + $runtimeDll)) +
    @($references | ForEach-Object { '/reference:' + $_ }) + $runtimeSources
$runtimeResponse = Join-Path $output 'runtime.rsp'
[IO.File]::WriteAllLines($runtimeResponse, @($runtimeArgs | ForEach-Object { '"' + $_ + '"' }))
& $dotnet $compiler ('@' + $runtimeResponse)
if ($LASTEXITCODE -ne 0) { throw 'Unity runtime compilation failed' }
$testExe = Join-Path $output 'UnityRouteChecks.exe'
$testArgs = @('/nologo', '/target:exe', '/langversion:9.0', '/nostdlib+', ('/out:' + $testExe), ('/reference:' + $runtimeDll)) +
    @($references | ForEach-Object { '/reference:' + $_ }) + (Join-Path $PSScriptRoot 'unity-route-checks.cs')
$testResponse = Join-Path $output 'checks.rsp'
[IO.File]::WriteAllLines($testResponse, @($testArgs | ForEach-Object { '"' + $_ + '"' }))
& $dotnet $compiler ('@' + $testResponse)
if ($LASTEXITCODE -ne 0) { throw 'Unity check compilation failed' }
$previousMonoPath = $env:MONO_PATH
try {
    $env:MONO_PATH = (@($output) + @($references | ForEach-Object { Split-Path -Parent $_ } | Select-Object -Unique)) -join ';'
    & (Join-Path $UnityEditor 'Data\MonoBleedingEdge\bin\mono.exe') $testExe
    if ($LASTEXITCODE -ne 0) { throw 'Unity route contract checks failed' }
} finally {
    $env:MONO_PATH = $previousMonoPath
}
