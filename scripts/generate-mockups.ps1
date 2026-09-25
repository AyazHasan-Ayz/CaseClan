Add-Type -AssemblyName System.Drawing

$models = @(
  @{slug='iphone-17'; name='iPhone 17'; family='iPhone 17'; width=2.81; height=5.89; radius=112; layout='dual-vertical'; camera=@{x=64;y=57;width=445;height=535}; lenses=@(@(.31,.27),@(.31,.73)); flash=@(.87,.48); lidar=$null; photoSource='assets/mockups/iphone-17-source.png'; crop=@(284,294,464,990)},
  @{slug='iphone-17-pro'; name='iPhone 17 Pro'; family='iPhone 17'; width=2.84; height=5.91; radius=108; layout='triple-wide'; camera=@{x=78;y=88;width=866;height=533}; lenses=@(@(.18,.30),@(.50,.48),@(.18,.70)); flash=@(.82,.24); lidar=@(.82,.72); photoSource='assets/mockups/iphone-17-pro-source.png'; crop=@(332,214,460,975)},
  @{slug='iphone-17-pro-max'; name='iPhone 17 Pro Max'; family='iPhone 17'; width=3.02; height=6.31; radius=105; layout='triple-wide'; camera=@{x=68;y=73;width=854;height=582}; lenses=@(@(.18,.28),@(.48,.47),@(.18,.69)); flash=@(.84,.22); lidar=@(.84,.67); photoSource='assets/mockups/iphone-17-pro-max-source.png'; crop=@(315,168,500,1045)},
  @{slug='iphone-16'; name='iPhone 16'; family='iPhone 16'; width=2.78; height=5.81; radius=114; layout='dual-vertical'; camera=@{x=78;y=74;width=286;height=489}; lenses=@(@(.5,.27),@(.5,.73)); flash=@(.87,.50); lidar=$null; photoSource='assets/mockups/iphone-16-source.png'; crop=@(335,232,480,970)},
  @{slug='iphone-16-plus'; name='iPhone 16 Plus'; family='iPhone 16'; width=3.06; height=6.33; radius=108; layout='dual-vertical'; camera=@{x=78;y=74;width=286;height=489}; lenses=@(@(.5,.27),@(.5,.73)); flash=@(.87,.50); lidar=$null; photoSource='assets/mockups/iphone-16-source.png'; crop=@(335,232,480,970)},
  @{slug='iphone-16-pro'; name='iPhone 16 Pro'; family='iPhone 16'; width=2.81; height=5.89; radius=109; layout='triple-square'; camera=@{x=72;y=83;width=503;height=484}; lenses=@(@(.31,.29),@(.69,.48),@(.31,.72)); flash=@(.78,.23); lidar=@(.78,.76); photoSource='assets/mockups/iphone-16-pro-source.png'; crop=@(340,230,455,960)},
  @{slug='iphone-16-pro-max'; name='iPhone 16 Pro Max'; family='iPhone 16'; width=3.06; height=6.42; radius=104; layout='triple-square'; camera=@{x=80;y=80;width=458;height=484}; lenses=@(@(.31,.29),@(.69,.48),@(.31,.72)); flash=@(.78,.23); lidar=@(.78,.76); photoSource='assets/mockups/iphone-16-pro-max-source.png'; crop=@(330,176,480,1015)},
  @{slug='iphone-15'; name='iPhone 15'; family='iPhone 15'; width=2.82; height=5.81; radius=116; layout='dual-diagonal'; camera=@{x=74;y=73;width=445;height=448}; lenses=@(@(.31,.31),@(.69,.69)); flash=@(.76,.22); lidar=$null; photoSource='assets/mockups/iphone-15-source.png'; crop=@(335,232,480,990)},
  @{slug='iphone-15-pro'; name='iPhone 15 Pro'; family='iPhone 15'; width=2.78; height=5.77; radius=112; layout='triple-square'; camera=@{x=74;y=75;width=493;height=488}; lenses=@(@(.31,.29),@(.69,.48),@(.31,.72)); flash=@(.78,.23); lidar=@(.78,.76); photoSource='assets/mockups/iphone-15-pro-source.png'; crop=@(337,232,465,960)},
  @{slug='iphone-15-pro-max'; name='iPhone 15 Pro Max'; family='iPhone 15'; width=3.02; height=6.29; radius=106; layout='triple-square'; camera=@{x=86;y=77;width=479;height=487}; lenses=@(@(.31,.29),@(.69,.48),@(.31,.72)); flash=@(.78,.23); lidar=@(.78,.76); photoSource='assets/mockups/iphone-15-pro-max-source.png'; crop=@(330,160,480,1035)},
  @{slug='iphone-15-plus'; name='iPhone 15 Plus'; family='iPhone 15'; width=3.06; height=6.33; radius=108; layout='dual-diagonal'; camera=@{x=86;y=67;width=437;height=473}; lenses=@(@(.31,.31),@(.69,.69)); flash=@(.76,.22); lidar=$null; photoSource='assets/mockups/iphone-15-plus-source.png'; crop=@(333,154,480,1045)}
)

function New-Bitmap { [System.Drawing.Bitmap]::new(1000,2000,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb) }
function New-Graphics($bmp) { $g=[System.Drawing.Graphics]::FromImage($bmp); $g.SmoothingMode='AntiAlias'; $g.InterpolationMode='HighQualityBicubic'; $g.PixelOffsetMode='HighQuality'; $g.Clear([System.Drawing.Color]::Transparent); $g }
function Rounded-Path($x,$y,$w,$h,$r) { $p=[System.Drawing.Drawing2D.GraphicsPath]::new(); $d=$r*2; $p.AddArc($x,$y,$d,$d,180,90); $p.AddArc($x+$w-$d,$y,$d,$d,270,90); $p.AddArc($x+$w-$d,$y+$h-$d,$d,$d,0,90); $p.AddArc($x,$y+$h-$d,$d,$d,90,90); $p.CloseFigure(); $p }
function Save-Layer($bmp,$path) { $bmp.Save($path,[System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose() }
function New-Brush($a,$r,$g,$b) { [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($a,$r,$g,$b)) }
function New-Pen($a,$r,$g,$b,$w) { [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb($a,$r,$g,$b),$w) }
function Draw-Lens($g,[float]$x,[float]$y,[float]$r) {
  $g.FillEllipse((New-Brush 105 0 0 0),$x-$r-7,$y-$r+9,$r*2+14,$r*2+14)
  $ring=[System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.PointF]::new($x-$r,$y-$r),[System.Drawing.PointF]::new($x+$r,$y+$r),[System.Drawing.Color]::FromArgb(255,238,240,241),[System.Drawing.Color]::FromArgb(255,65,70,74)); $g.FillEllipse($ring,$x-$r,$y-$r,$r*2,$r*2); $ring.Dispose()
  $g.DrawEllipse((New-Pen 255 250 250 247 5),$x-$r+3,$y-$r+3,$r*2-6,$r*2-6)
  $g.DrawEllipse((New-Pen 255 20 23 26 15),$x-$r+12,$y-$r+12,$r*2-24,$r*2-24)
  $lensPath=[System.Drawing.Drawing2D.GraphicsPath]::new();$lensPath.AddEllipse($x-$r*.66,$y-$r*.66,$r*1.32,$r*1.32);$glass=[System.Drawing.Drawing2D.PathGradientBrush]::new($lensPath); $glass.CenterColor=[System.Drawing.Color]::FromArgb(255,1,4,8); $glass.SurroundColors=[System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(255,37,46,56)); $g.FillPath($glass,$lensPath); $glass.Dispose();$lensPath.Dispose()
  $g.DrawEllipse((New-Pen 150 105 122 138 3),$x-$r*.61,$y-$r*.61,$r*1.22,$r*1.22)
  $g.FillEllipse((New-Brush 150 103 145 187),$x-$r*.30,$y-$r*.33,$r*.27,$r*.15)
  $g.FillEllipse((New-Brush 80 215 232 244),$x+$r*.10,$y+$r*.10,$r*.14,$r*.09)
}
function Draw-Flash($g,[float]$x,[float]$y,[float]$r) {
  $g.FillEllipse((New-Brush 120 35 38 39),$x-$r-4,$y-$r+3,$r*2+8,$r*2+8)
  $flashPath=[System.Drawing.Drawing2D.GraphicsPath]::new();$flashPath.AddEllipse($x-$r,$y-$r,$r*2,$r*2);$flash=[System.Drawing.Drawing2D.PathGradientBrush]::new($flashPath); $flash.CenterColor=[System.Drawing.Color]::FromArgb(255,255,255,244); $flash.SurroundColors=[System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(255,194,192,178)); $g.FillPath($flash,$flashPath); $flash.Dispose();$flashPath.Dispose()
  $g.DrawEllipse((New-Pen 210 116 117 112 3),$x-$r,$y-$r,$r*2,$r*2)
  $g.FillEllipse((New-Brush 155 255 255 255),$x-$r*.35,$y-$r*.40,$r*.42,$r*.30)
}

foreach($m in $models){
  $dir=Join-Path 'public/mockups' $m.slug; New-Item -ItemType Directory -Force $dir | Out-Null
  $cx=[float]$m.camera.x; $cy=[float]$m.camera.y; $cw=[float]$m.camera.width; $ch=[float]$m.camera.height
  $phone=Rounded-Path 75 24 850 1952 $m.radius
  $camera=Rounded-Path $cx $cy $cw $ch ([Math]::Min($cw,$ch)*.22)

  $bmp=New-Bitmap; $g=New-Graphics $bmp
  if($m.photoSource -and (Test-Path -LiteralPath $m.photoSource)){
    $source=[System.Drawing.Bitmap]::new($m.photoSource)
    $dest=[System.Drawing.Rectangle]::new(42,24,916,1952)
    $crop=[System.Drawing.Rectangle]::new($m.crop[0],$m.crop[1],$m.crop[2],$m.crop[3])
    $photoClip=Rounded-Path 42 24 916 1952 ($m.radius+38)
    $g.SetClip($photoClip)
    $g.DrawImage($source,$dest,$crop,[System.Drawing.GraphicsUnit]::Pixel)
    $g.ResetClip()
    $photoClip.Dispose()
    $source.Dispose()
  } else {
    $body=[System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Point]::new(75,24),[System.Drawing.Point]::new(925,1976),[System.Drawing.Color]::FromArgb(255,251,251,249),[System.Drawing.Color]::FromArgb(255,196,200,202)); $g.FillPath($body,$phone); $body.Dispose()
    $g.DrawPath((New-Pen 220 91 99 104 6),$phone); $g.DrawPath((New-Pen 195 255 255 255 4),(Rounded-Path 81 30 838 1940 ($m.radius-6)))
    $panel=[System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Point]::new(112,80),[System.Drawing.Point]::new(865,1910),[System.Drawing.Color]::FromArgb(155,255,255,255),[System.Drawing.Color]::FromArgb(80,220,223,224)); $g.FillPath($panel,(Rounded-Path 94 43 812 1914 ($m.radius-17))); $panel.Dispose()
    $g.FillPath((New-Brush 78 0 0 0),(Rounded-Path ($cx-9) ($cy+10) ($cw+18) ($ch+18) ([Math]::Min($cw,$ch)*.23)))
    $plate=[System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.PointF]::new($cx,$cy),[System.Drawing.PointF]::new($cx+$cw,$cy+$ch),[System.Drawing.Color]::FromArgb(255,249,249,246),[System.Drawing.Color]::FromArgb(255,174,178,181)); $g.FillPath($plate,$camera); $plate.Dispose()
    $g.DrawPath((New-Pen 255 24 27 29 13),$camera); $g.DrawPath((New-Pen 230 250 250 247 4),(Rounded-Path ($cx+10) ($cy+10) ($cw-20) ($ch-20) ([Math]::Min($cw,$ch)*.18)))
    $lensR=[Math]::Min($cw,$ch) * ($(if($m.layout -eq 'triple-wide'){.205}elseif($m.layout -eq 'dual-vertical'){.285}else{.205}))
    foreach($pt in $m.lenses){Draw-Lens $g ($cx+$cw*$pt[0]) ($cy+$ch*$pt[1]) $lensR}
    if($m.flash){$fx=$cx+$cw*$m.flash[0];$fy=$cy+$ch*$m.flash[1];Draw-Flash $g $fx $fy ($(if($m.layout -eq 'dual-vertical'){17}else{24}))}
    if($m.lidar){$lx=$cx+$cw*$m.lidar[0];$ly=$cy+$ch*$m.lidar[1];$g.FillEllipse((New-Brush 255 10 12 15),$lx-23,$ly-23,46,46);$g.DrawEllipse((New-Pen 210 105 109 112 4),$lx-23,$ly-23,46,46)}
    $micX=$cx+$cw*$(if($m.layout -eq 'dual-vertical'){.83}else{.78});$micY=$cy+$ch*$(if($m.layout -eq 'dual-vertical'){.63}else{.50});$g.FillEllipse((New-Brush 255 31 34 36),$micX-8,$micY-8,16,16)
  }
  $g.Dispose(); Save-Layer $bmp (Join-Path $dir 'base.png')

  $bmp=New-Bitmap; $g=New-Graphics $bmp; $outer=Rounded-Path 42 0 916 2000 ($m.radius+38); $middle=Rounded-Path 57 10 886 1980 ($m.radius+23); $inner=Rounded-Path 82 30 836 1940 ($m.radius-2); $shell=[System.Drawing.Drawing2D.GraphicsPath]::new([System.Drawing.Drawing2D.FillMode]::Alternate); $shell.AddPath($outer,$false);$shell.AddPath($inner,$false)
  $cameraOuter=Rounded-Path ($cx-28) ($cy-28) ($cw+56) ($ch+56) ([Math]::Min($cw,$ch)*.26);$cameraInner=Rounded-Path ($cx-8) ($cy-8) ($cw+16) ($ch+16) ([Math]::Min($cw,$ch)*.225);$cameraRim=[System.Drawing.Drawing2D.GraphicsPath]::new([System.Drawing.Drawing2D.FillMode]::Alternate);$cameraRim.AddPath($cameraOuter,$false);$cameraRim.AddPath($cameraInner,$false)
  $leftButton=Rounded-Path 30 470 38 270 16;$rightButton=Rounded-Path 932 405 38 330 16
  $port=Rounded-Path 458 1963 84 20 9
  if($m.photoSource){
    $g.DrawPath((New-Pen 42 255 255 255 4),$outer);$g.DrawPath((New-Pen 24 44 56 62 4),$inner);$g.DrawPath((New-Pen 34 255 255 255 3),$cameraOuter)
  } else {
    $rim=[System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Point]::new(42,0),[System.Drawing.Point]::new(958,2000),[System.Drawing.Color]::FromArgb(145,251,255,255),[System.Drawing.Color]::FromArgb(88,143,167,177));$g.FillPath($rim,$shell);$rim.Dispose()
    $g.DrawPath((New-Pen 235 255 255 255 8),$outer);$g.DrawPath((New-Pen 145 179 201 210 10),$middle);$g.DrawPath((New-Pen 125 35 48 54 9),$inner);$g.DrawPath((New-Pen 190 255 255 255 3),(Rounded-Path 87 35 826 1930 ($m.radius-7)))
    $g.FillPath((New-Brush 145 224 238 244),$cameraRim);$g.DrawPath((New-Pen 235 255 255 255 7),$cameraOuter);$g.DrawPath((New-Pen 155 46 57 62 8),$cameraInner)
    $g.FillPath((New-Brush 155 213 230 237),$leftButton);$g.FillPath((New-Brush 155 213 230 237),$rightButton);$g.DrawPath((New-Pen 190 255 255 255 4),$leftButton);$g.DrawPath((New-Pen 190 255 255 255 4),$rightButton)
    foreach($x in @(365,455,545,635)){$g.FillEllipse((New-Brush 135 76 91 98),$x,1969,34,12)};$g.FillPath((New-Brush 150 53 66 72),$port);$g.DrawPath((New-Pen 160 255 255 255 2),$port)
  }
  $g.Dispose();Save-Layer $bmp (Join-Path $dir 'case-overlay.png')

  $bmp=New-Bitmap;$g=New-Graphics $bmp;$g.FillPath([System.Drawing.Brushes]::White,$phone);$g.CompositingMode='SourceCopy';$g.FillPath([System.Drawing.SolidBrush]::new([System.Drawing.Color]::Transparent),$camera);$g.Dispose();Save-Layer $bmp (Join-Path $dir 'print-mask.png')
  $bmp=New-Bitmap;$g=New-Graphics $bmp;$g.FillPath([System.Drawing.Brushes]::White,$camera);$g.Dispose();Save-Layer $bmp (Join-Path $dir 'camera-mask.png')

  $bmp=New-Bitmap;$g=New-Graphics $bmp;$shine=[System.Drawing.PointF[]]@([System.Drawing.PointF]::new(310,18),[System.Drawing.PointF]::new(440,18),[System.Drawing.PointF]::new(785,1982),[System.Drawing.PointF]::new(665,1982));$g.FillPolygon((New-Brush $(if($m.photoSource){18}else{42}) 255 255 255),$shine);$edgeShine=[System.Drawing.PointF[]]@([System.Drawing.PointF]::new(75,90),[System.Drawing.PointF]::new(112,62),[System.Drawing.PointF]::new(112,1870),[System.Drawing.PointF]::new(77,1915));$g.FillPolygon((New-Brush $(if($m.photoSource){22}else{62}) 255 255 255),$edgeShine);$g.DrawPath((New-Pen $(if($m.photoSource){42}else{145}) 255 255 255 5),$phone);$g.DrawPath((New-Pen $(if($m.photoSource){35}else{115}) 255 255 255 4),$cameraOuter);$g.Dispose();Save-Layer $bmp (Join-Path $dir 'highlight-overlay.png')
  $bmp=New-Bitmap;$g=New-Graphics $bmp;$g.DrawPath((New-Pen $(if($m.photoSource){28}else{110}) 19 29 34 18),$phone);$g.DrawPath((New-Pen $(if($m.photoSource){32}else{135}) 9 12 14 16),$camera);$g.DrawPath((New-Pen $(if($m.photoSource){20}else{80}) 12 18 21 24),$inner);$g.Dispose();Save-Layer $bmp (Join-Path $dir 'shadow-overlay.png')

  $config=[ordered]@{id=$m.slug;displayName=$m.name;family=$m.family;model=$m.name;slug=$m.slug;photorealistic=[bool]$m.photoSource;aspectRatio=[Math]::Round($m.width/$m.height,5);physicalSize=@{width=$m.width;height=$m.height};printArea=@{x=.075;y=.012;width=.85;height=.976};safeArea=@{top=.035;right=.055;bottom=.045;left=.055};cameraExclusion=@{x=$cx/1000;y=$cy/2000;width=$cw/1000;height=$ch/2000};camera=@{layout=$m.layout;lenses=$m.lenses;flash=$m.flash;lidar=$m.lidar};scalingRules=@{canvasWidth=1000;canvasHeight=2000;minLayerSize=60;maxLayerWidth=870;maxLayerHeight=1250};previewCrop=@{x=.05;y=0;width=.90;height=1};baseImage="/mockups/$($m.slug)/base.png";maskImage="/mockups/$($m.slug)/print-mask.png";overlayImage="/mockups/$($m.slug)/case-overlay.png";shadowImage="/mockups/$($m.slug)/shadow-overlay.png";assets=@{base='base.png';caseOverlay='case-overlay.png';printMask='print-mask.png';cameraMask='camera-mask.png';highlightOverlay='highlight-overlay.png';shadowOverlay='shadow-overlay.png'}}
  $config | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 (Join-Path $dir 'config.json')
  $phone.Dispose();$camera.Dispose();$outer.Dispose();$middle.Dispose();$inner.Dispose();$shell.Dispose();$cameraOuter.Dispose();$cameraInner.Dispose();$cameraRim.Dispose();$leftButton.Dispose();$rightButton.Dispose();$port.Dispose()
}
