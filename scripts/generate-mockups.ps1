Add-Type -AssemblyName System.Drawing

$models = @(
  @{slug='iphone-17'; name='iPhone 17'; width=2.81; height=5.89; radius=112; layout='dual-vertical'; camera=@{x=66;y=58;width=285;height=520}; lenses=@(@(.5,.27),@(.5,.73)); flash=@(.84,.50); lidar=$null},
  @{slug='iphone-17-pro'; name='iPhone 17 Pro'; width=2.84; height=5.91; radius=108; layout='triple-wide'; camera=@{x=48;y=55;width=904;height=435}; lenses=@(@(.18,.5),@(.49,.5),@(.78,.5)); flash=@(.92,.23); lidar=@(.92,.68)},
  @{slug='iphone-17-pro-max'; name='iPhone 17 Pro Max'; width=3.02; height=6.31; radius=105; layout='triple-wide'; camera=@{x=46;y=52;width=908;height=438}; lenses=@(@(.18,.5),@(.49,.5),@(.78,.5)); flash=@(.92,.23); lidar=@(.92,.68)},
  @{slug='iphone-16'; name='iPhone 16'; width=2.78; height=5.81; radius=114; layout='dual-vertical'; camera=@{x=70;y=62;width=270;height=505}; lenses=@(@(.5,.27),@(.5,.73)); flash=@(.87,.50); lidar=$null},
  @{slug='iphone-16-pro'; name='iPhone 16 Pro'; width=2.81; height=5.89; radius=109; layout='triple-square'; camera=@{x=60;y=56;width=500;height=515}; lenses=@(@(.31,.29),@(.69,.48),@(.31,.72)); flash=@(.78,.23); lidar=@(.78,.76)},
  @{slug='iphone-16-pro-max'; name='iPhone 16 Pro Max'; width=3.06; height=6.42; radius=104; layout='triple-square'; camera=@{x=57;y=53;width=508;height=522}; lenses=@(@(.31,.29),@(.69,.48),@(.31,.72)); flash=@(.78,.23); lidar=@(.78,.76)},
  @{slug='iphone-15'; name='iPhone 15'; width=2.82; height=5.81; radius=116; layout='dual-diagonal'; camera=@{x=68;y=60;width=405;height=430}; lenses=@(@(.31,.31),@(.69,.69)); flash=@(.76,.22); lidar=$null},
  @{slug='iphone-15-pro'; name='iPhone 15 Pro'; width=2.78; height=5.77; radius=112; layout='triple-square'; camera=@{x=62;y=58;width=492;height=505}; lenses=@(@(.31,.29),@(.69,.48),@(.31,.72)); flash=@(.78,.23); lidar=@(.78,.76)},
  @{slug='iphone-15-pro-max'; name='iPhone 15 Pro Max'; width=3.02; height=6.29; radius=106; layout='triple-square'; camera=@{x=59;y=55;width=500;height=512}; lenses=@(@(.31,.29),@(.69,.48),@(.31,.72)); flash=@(.78,.23); lidar=@(.78,.76)},
  @{slug='iphone-15-plus'; name='iPhone 15 Plus'; width=3.06; height=6.33; radius=108; layout='dual-diagonal'; camera=@{x=65;y=57;width=410;height=435}; lenses=@(@(.31,.31),@(.69,.69)); flash=@(.76,.22); lidar=$null}
)

function New-Bitmap { [System.Drawing.Bitmap]::new(1000,2000,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb) }
function New-Graphics($bmp) { $g=[System.Drawing.Graphics]::FromImage($bmp); $g.SmoothingMode='AntiAlias'; $g.InterpolationMode='HighQualityBicubic'; $g.PixelOffsetMode='HighQuality'; $g.Clear([System.Drawing.Color]::Transparent); $g }
function Rounded-Path($x,$y,$w,$h,$r) { $p=[System.Drawing.Drawing2D.GraphicsPath]::new(); $d=$r*2; $p.AddArc($x,$y,$d,$d,180,90); $p.AddArc($x+$w-$d,$y,$d,$d,270,90); $p.AddArc($x+$w-$d,$y+$h-$d,$d,$d,0,90); $p.AddArc($x,$y+$h-$d,$d,$d,90,90); $p.CloseFigure(); $p }
function Save-Layer($bmp,$path) { $bmp.Save($path,[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose() }

foreach($m in $models){
  $dir=Join-Path 'public/mockups' $m.slug; New-Item -ItemType Directory -Force $dir | Out-Null
  $cx=[float]$m.camera.x; $cy=[float]$m.camera.y; $cw=[float]$m.camera.width; $ch=[float]$m.camera.height
  $phone=Rounded-Path 75 24 850 1952 $m.radius
  $camera=Rounded-Path $cx $cy $cw $ch ([Math]::Min($cw,$ch)*.22)

  $bmp=New-Bitmap; $g=New-Graphics $bmp
  $body=[System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Point]::new(75,24),[System.Drawing.Point]::new(925,1976),[System.Drawing.Color]::FromArgb(255,248,248,246),[System.Drawing.Color]::FromArgb(255,184,188,190)); $g.FillPath($body,$phone); $body.Dispose()
  $g.DrawPath([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(210,115,122,126),5),$phone)
  $plate=[System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.PointF]::new($cx,$cy),[System.Drawing.PointF]::new($cx+$cw,$cy+$ch),[System.Drawing.Color]::FromArgb(255,245,245,242),[System.Drawing.Color]::FromArgb(255,161,165,168)); $g.FillPath($plate,$camera); $plate.Dispose(); $g.DrawPath([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255,35,38,40),10),$camera)
  $lensR=[Math]::Min($cw,$ch) * ($(if($m.layout -eq 'triple-wide'){.23}elseif($m.layout -eq 'dual-vertical'){.31}else{.225}))
  foreach($pt in $m.lenses){$lx=$cx+$cw*$pt[0];$ly=$cy+$ch*$pt[1];$g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255,20,23,27)),$lx-$lensR,$ly-$lensR,$lensR*2,$lensR*2);$g.DrawEllipse([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255,188,194,199),12),$lx-$lensR,$ly-$lensR,$lensR*2,$lensR*2);$g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255,3,7,12)),$lx-$lensR*.65,$ly-$lensR*.65,$lensR*1.3,$lensR*1.3);$g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(110,95,151,205)),$lx-$lensR*.26,$ly-$lensR*.30,$lensR*.25,$lensR*.16)}
  if($m.flash){$fx=$cx+$cw*$m.flash[0];$fy=$cy+$ch*$m.flash[1];$g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255,252,244,216)),$fx-24,$fy-24,48,48);$g.DrawEllipse([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255,175,173,162),5),$fx-24,$fy-24,48,48)}
  if($m.lidar){$lx=$cx+$cw*$m.lidar[0];$ly=$cy+$ch*$m.lidar[1];$g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255,10,12,15)),$lx-23,$ly-23,46,46)}
  $g.Dispose(); Save-Layer $bmp (Join-Path $dir 'base.png')

  $bmp=New-Bitmap; $g=New-Graphics $bmp; $outer=Rounded-Path 50 4 900 1992 ($m.radius+28); $inner=Rounded-Path 76 25 848 1950 $m.radius; $shell=[System.Drawing.Drawing2D.GraphicsPath]::new([System.Drawing.Drawing2D.FillMode]::Alternate); $shell.AddPath($outer,$false);$shell.AddPath($inner,$false);$g.FillPath([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(92,226,239,244)),$shell);$g.DrawPath([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(205,255,255,255),7),$outer);$g.DrawPath([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(100,64,80,88),8),$inner);$g.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(105,224,239,245)),40,480,30,270);$g.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(105,224,239,245)),930,410,30,330);$g.Dispose();Save-Layer $bmp (Join-Path $dir 'case-overlay.png')

  $bmp=New-Bitmap;$g=New-Graphics $bmp;$g.FillPath([System.Drawing.Brushes]::White,$phone);$g.CompositingMode='SourceCopy';$g.FillPath([System.Drawing.SolidBrush]::new([System.Drawing.Color]::Transparent),$camera);$g.Dispose();Save-Layer $bmp (Join-Path $dir 'print-mask.png')
  $bmp=New-Bitmap;$g=New-Graphics $bmp;$g.FillPath([System.Drawing.Brushes]::White,$camera);$g.Dispose();Save-Layer $bmp (Join-Path $dir 'camera-mask.png')

  $bmp=New-Bitmap;$g=New-Graphics $bmp;$shine=[System.Drawing.PointF[]]@([System.Drawing.PointF]::new(360,30),[System.Drawing.PointF]::new(590,30),[System.Drawing.PointF]::new(900,1970),[System.Drawing.PointF]::new(720,1970));$g.FillPolygon([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(34,255,255,255)),$shine);$g.DrawPath([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(118,255,255,255),5),$phone);$g.Dispose();Save-Layer $bmp (Join-Path $dir 'highlight-overlay.png')
  $bmp=New-Bitmap;$g=New-Graphics $bmp;$g.DrawPath([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(90,25,34,38),16),$phone);$g.DrawPath([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(100,12,15,18),14),$camera);$g.Dispose();Save-Layer $bmp (Join-Path $dir 'shadow-overlay.png')

  $config=[ordered]@{model=$m.name;slug=$m.slug;aspectRatio=[Math]::Round($m.width/$m.height,5);physicalSize=@{width=$m.width;height=$m.height};printArea=@{x=.075;y=.012;width=.85;height=.976};safeArea=@{top=.035;right=.055;bottom=.045;left=.055};cameraExclusion=@{x=$cx/1000;y=$cy/2000;width=$cw/1000;height=$ch/2000};camera=@{layout=$m.layout;lenses=$m.lenses;flash=$m.flash;lidar=$m.lidar};scalingRules=@{canvasWidth=1000;canvasHeight=2000;minLayerSize=60;maxLayerWidth=870;maxLayerHeight=1250};previewCrop=@{x=.05;y=0;width=.90;height=1};assets=@{base='base.png';caseOverlay='case-overlay.png';printMask='print-mask.png';cameraMask='camera-mask.png';highlightOverlay='highlight-overlay.png';shadowOverlay='shadow-overlay.png'}}
  $config | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 (Join-Path $dir 'config.json')
  $phone.Dispose();$camera.Dispose();$outer.Dispose();$inner.Dispose();$shell.Dispose()
}
