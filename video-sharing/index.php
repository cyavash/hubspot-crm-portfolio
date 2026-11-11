<?php
declare(strict_types=1);
/* Siavash Video Sharing - PHP 8.2+, no database or external dependencies. */
const MAX_VIDEO = 2147483648;
const CHUNK = 4194304;
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
$store = getenv('VIDEO_STORAGE_PATH') ?: dirname(__DIR__, 3) . '/video-library';
foreach ([$store, "$store/videos", "$store/uploads", "$store/limits"] as $d) {
    if (!is_dir($d) && !mkdir($d, 0700, true) && !is_dir($d)) { http_response_code(503); exit('Video storage is unavailable.'); }
}
$configPath = "$store/owner.json";
function read_json(string $p): array { return is_file($p) ? (json_decode((string)file_get_contents($p), true) ?: []) : []; }
function write_json(string $p, array $v): void {
    $tmp = $p . '.' . bin2hex(random_bytes(8)) . '.tmp';
    if (file_put_contents($tmp, json_encode($v, JSON_THROW_ON_ERROR), LOCK_EX) === false || !rename($tmp, $p)) throw new RuntimeException('Could not save changes.');
    chmod($p, 0600);
}
function respond(array $v, int $code = 200): never { http_response_code($code); header('Content-Type: application/json'); echo json_encode($v); exit; }
function esc(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function valid_id(string $s): bool { return (bool)preg_match('/^[a-f0-9]{32}$/D', $s); }
function fail(string $s, int $code=400): never { respond(['error'=>$s], $code); }
$action = (string)($_GET['action'] ?? '');
$videoId = (string)($_GET['v'] ?? $_GET['id'] ?? '');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Cache-Control: no-store, private');
header('X-Frame-Options: SAMEORIGIN');
if ($action === 'media') {
    if (!valid_id($videoId)) { http_response_code(404); exit; }
    $meta=read_json("$store/videos/$videoId.json");
    $file="$store/videos/$videoId.bin";
    if (!$meta || !is_file($file)) { http_response_code(404); exit; }
    $size=filesize($file); $start=0; $end=$size-1;
    header('Content-Type: '.($meta['mime'] === 'video/webm' ? 'video/webm' : 'video/mp4'));
    header('Accept-Ranges: bytes');
    if (isset($_SERVER['HTTP_RANGE'])) {
        if (!preg_match('/^bytes=(\d*)-(\d*)$/D', trim($_SERVER['HTTP_RANGE']), $m) || ($m[1]==='' && $m[2]==='')) { header("Content-Range: bytes */$size"); http_response_code(416); exit; }
        if ($m[1]==='') { $start=max(0,$size-(int)$m[2]); }
        else { $start=(int)$m[1]; if ($m[2]!=='') $end=min($end,(int)$m[2]); }
        if ($start>$end || $start>=$size) { header("Content-Range: bytes */$size"); http_response_code(416); exit; }
        http_response_code(206); header("Content-Range: bytes $start-$end/$size");
    }
    header('Content-Length: '.($end-$start+1));
    if ($_SERVER['REQUEST_METHOD']==='HEAD') exit;
    set_time_limit(0); while(ob_get_level()) ob_end_clean();
    $in=fopen($file,'rb'); fseek($in,$start); $left=$end-$start+1;
    while($left>0 && !connection_aborted()) { $buf=fread($in,min(262144,$left)); if($buf===false || $buf==='') break; echo $buf; $left-=strlen($buf); flush(); }
    fclose($in); exit;
}
session_name('siavash_video_owner');
session_set_cookie_params(['lifetime'=>0,'path'=>$base,'secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
ini_set('session.use_strict_mode','1'); session_start();
if (!isset($_SESSION['csrf'])) $_SESSION['csrf']=bin2hex(random_bytes(32));
$csrf=$_SESSION['csrf'];
$config=read_json($configPath);
$owner=isset($_SESSION['owner_until']) && $_SESSION['owner_until']>time() && isset($config['password']);
$setupKey=(string)($_GET['setup']??'');
$bootstrapFile=__DIR__.'/bootstrap.php';
$bootstrapHash=is_file($bootstrapFile) ? (require $bootstrapFile) : '';
$canSetup=!$config && is_string($bootstrapHash) && strlen($bootstrapHash)===64 && hash_equals($bootstrapHash, hash('sha256',$setupKey));
$error='';
if ($_SERVER['REQUEST_METHOD']==='POST') {
    if (!hash_equals($csrf,(string)($_SERVER['HTTP_X_CSRF_TOKEN']??$_POST['csrf']??''))) fail('Your session expired. Reload the page and try again.',403);
    if ($action==='login' || $action==='setup') {
        $ipHash=hash('sha256',$_SERVER['REMOTE_ADDR']??'unknown'); $limitPath="$store/limits/$ipHash.json"; $limit=read_json($limitPath);
        if (($limit['until']??0)>time() && ($limit['count']??0)>=10) { http_response_code(429); $error='Too many attempts. Please try again in 15 minutes.'; }
        else {
            $password=(string)($_POST['password']??'');
            if ($action==='setup' && $canSetup && strlen($password)>=12 && strlen($password)<=200) {
                $lock=fopen("$store/setup.lock",'c'); flock($lock,LOCK_EX);
                if (is_file($configPath)) { flock($lock,LOCK_UN); fail('The owner account is already set up.',409); }
                write_json($configPath,['password'=>password_hash($password,PASSWORD_DEFAULT),'created'=>time()]);
                flock($lock,LOCK_UN); fclose($lock);
                session_regenerate_id(true); $_SESSION['owner_until']=time()+28800;
                header('Location: '.$base); exit;
            }
            elseif ($action==='login' && isset($config['password']) && password_verify($password,$config['password'])) {
                session_regenerate_id(true); $_SESSION['owner_until']=time()+28800; write_json($limitPath,['count'=>0,'until'=>0]); header('Location: '.$base); exit;
            }
            else { write_json($limitPath,['count'=>($limit['until']??0)>time()?($limit['count']??0)+1:1,'until'=>time()+900]); $error=$action==='setup'?'Use a password of at least 12 characters.':'That password did not match.'; }
        }
    }
    elseif ($action==='logout') { $_SESSION=[]; session_destroy(); header('Location: '.$base); exit; }
    else {
        if (!$owner) fail('Sign in to upload a video.',401);
        try {
            if ($action==='init') {
                $title=trim((string)($_POST['title']??'')); $name=(string)($_POST['name']??''); $size=(int)($_POST['size']??0);
                if (!$title || strlen($title)>240) fail('Enter a title of up to 240 characters.');
                if ($size<1 || $size>MAX_VIDEO || !preg_match('/\.(mp4|webm)$/iD',$name)) fail('Choose an MP4 or WebM video up to 2 GB.');
                $used=0; foreach(glob("$store/videos/*.bin")?:[] as $p) $used+=filesize($p);
                if ($used+$size>21474836480 || disk_free_space($store)<$size+52428800) fail('Video storage is full.',507);
                $id=bin2hex(random_bytes(16));
                write_json("$store/uploads/$id.json",['title'=>$title,'size'=>$size,'next'=>0,'bytes'=>0,'created'=>time(),'ext'=>strtolower(pathinfo($name,PATHINFO_EXTENSION))]);
                respond(['id'=>$id,'chunkSize'=>CHUNK]);
            }
            if (!valid_id($videoId)) fail('Upload not found.',404);
            $manifest="$store/uploads/$videoId.json"; $part="$store/uploads/$videoId.part";
            $lock=fopen("$store/uploads/$videoId.lock",'c'); if(!$lock) throw new RuntimeException('Upload is unavailable.'); flock($lock,LOCK_EX);
            $upload=read_json($manifest); if(!$upload) fail('Upload not found. Please select the file again.',404);
            if ($action==='chunk') {
                $index=(int)($_GET['index']??-1);
                if($index<$upload['next']) respond(['next'=>$upload['next']]);
                if($index!==$upload['next']) fail('Upload order changed. Retry this video.',409);
                $chunk=file_get_contents('php://input',false,null,0,CHUNK+1); $length=strlen($chunk?:'');
                if(!$length || $length>CHUNK || $upload['bytes']+$length>$upload['size']) fail('Invalid video chunk.');
                $out=fopen($part,'c+b'); fseek($out,$upload['bytes']); if(fwrite($out,$chunk)!==$length) throw new RuntimeException('Could not save the video.'); fclose($out);
                $upload['bytes']+=$length; $upload['next']++; write_json($manifest,$upload); respond(['next'=>$upload['next']]);
            }
            if($action==='finish') {
                if($upload['bytes']!==$upload['size'] || !is_file($part) || filesize($part)!==$upload['size']) fail('The upload is incomplete.',409);
                $mime=(new finfo(FILEINFO_MIME_TYPE))->file($part);
                if(!in_array($mime,['video/mp4','application/mp4','video/webm','video/quicktime'],true)) fail('This file is not a supported video.');
                $mime=$upload['ext']==='webm'?'video/webm':'video/mp4';
                $meta=['id'=>$videoId,'title'=>$upload['title'],'size'=>$upload['size'],'mime'=>$mime,'created'=>time()];
                if(!rename($part,"$store/videos/$videoId.bin")) throw new RuntimeException('Could not finish the upload.');
                chmod("$store/videos/$videoId.bin",0600); write_json("$store/videos/$videoId.json",$meta);
                unlink($manifest); respond(['url'=>$base.'?v='.$videoId]);
            }
            fail('Unknown action.',404);
        } catch(Throwable $e) { fail('Could not save the video. Please try again.',500); }
    }
}
$video=[];
if($videoId!=='' && $action==='') { if(valid_id($videoId)) $video=read_json("$store/videos/$videoId.json"); if(!$video) http_response_code(404); }
$videos=[]; if($owner && !$videoId) { foreach(glob("$store/videos/*.json")?:[] as $p) { $v=read_json($p); if($v) $videos[]=$v; } usort($videos,fn($a,$b)=>$b['created']<=>$a['created']); }
$nonce=base64_encode(random_bytes(18));
header("Content-Security-Policy: default-src 'none'; script-src 'nonce-$nonce'; style-src 'nonce-$nonce'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'");
session_write_close();
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title><?=esc($video['title']??'Videos')?> | Siavash Zahir</title>
<style nonce="<?=$nonce?>">
:root{color-scheme:light;--ink:#172b28;--muted:#68746e;--green:#174e40;--line:#dce3df;--paper:#f5f7f5}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,sans-serif}a{color:var(--green)}header{max-width:1180px;margin:auto;padding:27px 28px;display:flex;justify-content:space-between;align-items:center}header a{text-decoration:none;font-size:15px;font-weight:700;letter-spacing:.03em}header span{font-size:13px;color:var(--muted)}main{max-width:1124px;margin:25px auto 60px;padding:0 24px}.eyebrow{text-transform:uppercase;letter-spacing:.15em;font-size:11px;font-weight:700;color:var(--muted);margin:0 0 12px}h1{font-size:clamp(25px,4vw,36px);line-height:1.2;letter-spacing:-.035em;margin:0 0 12px}p{color:var(--muted);margin:0 0 24px}.panel{background:white;border:1px solid var(--line);border-radius:16px;padding:30px}.narrow{max-width:460px;margin:70px auto}.player{background:#101519;border-radius:14px;overflow:hidden;box-shadow:0 12px 40px #162b2810}video{display:block;width:100%;max-height:72vh;min-height:180px;background:#101519}.bar{padding:17px 0;display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap}.tools{display:flex;gap:10px;align-items:center}button,.button{font:inherit;font-size:14px;font-weight:600;border-radius:8px;padding:11px 17px;border:1px solid var(--line);background:white;color:var(--ink);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:7px}button:hover,.button:hover{border-color:#789c8f}button:disabled{opacity:.5;cursor:wait}.primary{background:var(--green);border-color:var(--green);color:white}input,select{font:inherit;border:1px solid #cbd5cf;border-radius:8px;background:white;color:var(--ink);padding:11px 12px}input:not([type=file]){width:100%}label{display:block;font-size:13px;font-weight:600;margin:18px 0 7px}select{padding:9px;font-size:14px}input[type=file]{width:100%;padding:22px;border-style:dashed;background:#f8faf8}input[type=file]::file-selector-button{background:#e8eeea;border:0;border-radius:6px;padding:8px 12px;margin-right:12px;cursor:pointer}form>button{margin-top:22px}.status{font-size:14px;min-height:24px;margin-top:15px;color:var(--green)}.error{color:#a02d27}.list{display:grid;gap:12px;margin-top:26px}.row{padding:20px 24px;background:white;border:1px solid var(--line);border-radius:12px;display:flex;gap:16px;align-items:center;justify-content:space-between}.row h2{font-size:16px;margin:0 0 3px;overflow-wrap:anywhere}.row small{color:var(--muted)}.row .tools{flex-shrink:0}progress{display:block;width:100%;height:7px;margin-top:20px;accent-color:var(--green)}.topline{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:25px}.topline form button{margin-top:0}footer{font-size:12px;color:var(--muted);padding-top:22px}#notice{font-size:13px;color:var(--green)}:focus-visible{outline:3px solid #77bda5;outline-offset:3px}@media(max-width:600px){header{padding:20px}main{padding:0 16px;margin-top:14px}.panel{padding:22px}.row{align-items:flex-start;flex-direction:column}.bar{gap:12px}.tools{flex-wrap:wrap}.row .tools{width:100%}.narrow{margin:35px auto}.topline{align-items:center}video{max-height:65vh}}
/* Keep controls outside the picture so recorded captions remain readable. */
body{background:#f3f5f3}header{max-width:1370px;padding:23px 30px;border-bottom:1px solid #e1e7e1}header a{letter-spacing:.075em;font-size:13px}main{max-width:1310px;margin:31px auto 45px}main:has(#video)>p.eyebrow{color:#738279;font-size:10px;margin-bottom:10px}main:has(#video)>h1{font-size:clamp(24px,3.2vw,34px);max-width:1000px}main:has(#video)>h1+p{display:none}.watch-meta{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:21px 0 24px}.author{display:flex;gap:11px;align-items:center}.avatar{height:39px;width:39px;border-radius:50%;background:#dfeae3;color:#24543e;display:grid;place-items:center;font-size:12px;font-weight:700}.author strong{display:block;font-size:13px}.author small{display:block;font-size:11px;color:#7d8981}.share-button{padding:10px 17px;box-shadow:0 3px 8px #174e4012}.player{border:1px solid #1f2d27;background:#101519;border-radius:15px;box-shadow:0 14px 40px #10251b12}.stage{position:relative;background:#101519;display:flex;justify-content:center}video{max-height:none;height:auto;width:100%;max-width:1120px;min-height:0;margin:auto}.center-play{position:absolute;top:46%;left:50%;transform:translate(-50%,-50%);border-radius:50px;padding:19px 29px;background:#f9fff9ee;color:#193e2d;border:1px solid #fff;box-shadow:0 8px 35px #0004;font-size:15px}.center-play:hover{background:#fff}.player-controls{background:#161f1b;padding:13px 20px 15px;color:#e6efe9;border-top:1px solid #29382e}.control-row{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:12px}.player-controls button,.player-controls select{border:1px solid #35483c;background:#202e25;color:#e6efe9;font-size:12px;padding:8px 10px;border-radius:7px}.player-controls button:hover{background:#304539}.player-controls select{padding:7px}.player-controls .tools{gap:8px}.time{font-size:12px;font-variant-numeric:tabular-nums;color:#afc0b4;margin-left:5px}.player-controls input[type=range]{border:0;border-radius:8px;padding:0;cursor:pointer;accent-color:#a2d9b5;width:100%;height:5px;background:#37483b}#seek{display:block;margin:3px 0 6px;width:100%;height:5px}#volume{width:65px}.viewer-foot{display:flex;justify-content:space-between;font-size:11px;color:#879188;padding:16px 3px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}[hidden]{display:none!important}.panel{box-shadow:0 8px 30px #173b2310}.topline{margin-bottom:27px}.topline h1{font-size:36px}.panel:has(#upload){padding:30px 34px}input[type=file]{padding:32px;background:#f4f8f4;border:1px dashed #aac0af}.row{box-shadow:0 2px 9px #15321c04}.player:fullscreen{display:flex;flex-direction:column;justify-content:center;border:0;border-radius:0;background:#101519}.player:fullscreen .stage{flex:1;min-height:0;align-items:center}.player:fullscreen video{max-width:100%;max-height:calc(100vh - 100px);height:100%;object-fit:contain}.player:fullscreen .player-controls{flex-shrink:0;width:100%}main:has(#video) footer{display:none}@media(min-width:1000px){video{max-height:none;width:100%;max-width:100%}.stage{min-height:340px}}@media(max-width:700px){header{padding:18px 20px}.watch-meta{margin:18px 0}.author small{display:none}.share-button{font-size:12px;padding:10px 12px}.player-controls{padding:12px}.control-row{gap:10px;flex-wrap:wrap}.player-controls .tools{gap:6px}.time{font-size:11px}#volume{display:none}.viewer-foot span:first-child{display:none}.panel:has(#upload){padding:22px}.topline h1{font-size:29px}.center-play{font-size:13px;padding:14px 21px}main:has(#video){margin-top:22px}}
</style></head><body><header><a href="https://siavash.tech">SIAVASH ZAHIR</a><span>Video walkthroughs</span></header><main>
<?php if($video): ?>
<p class="eyebrow">Shared walkthrough</p><h1><?=esc($video['title'])?></h1><p>Prepared by Siavash Zahir</p>
<div class="watch-meta"><div class="author"><span class="avatar">SZ</span><div><strong>Siavash Zahir</strong><small>HubSpot &amp; CRM walkthrough</small></div></div><div class="tools"><span id="notice" role="status"></span><button class="primary share-button" data-copy="<?=$base?>?v=<?=esc($videoId)?>">Copy video link</button></div></div>
<div class="player" id="player"><div class="stage"><video id="video" controls playsinline preload="metadata" tabindex="0" aria-label="<?=esc($video['title'])?>"><source src="<?=$base?>?action=media&amp;id=<?=esc($videoId)?>" type="<?=esc($video['mime'])?>">Your browser cannot play this video.</video><button id="centerPlay" class="center-play" aria-label="Play video" hidden>Play video</button></div>
<div class="player-controls" id="playerControls" hidden><input id="seek" type="range" min="0" max="100" step="0.05" value="0" aria-label="Seek video"><div class="control-row"><div class="tools"><button id="playPause" aria-label="Play">Play</button><button id="backTen" aria-label="Rewind 10 seconds">-10s</button><span class="time" id="time">0:00 / 0:00</span></div><div class="tools"><button id="mute" aria-label="Mute">Sound on</button><input id="volume" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume"><label for="speed" class="sr-only">Playback speed</label><select id="speed" aria-label="Playback speed"><option value="0.5">0.5x</option><option value="0.75">0.75x</option><option value="1" selected>1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="1.75">1.75x</option><option value="2">2x</option></select><button id="fullscreen" aria-label="Fullscreen">Fullscreen</button></div></div></div></div>
<div class="viewer-foot"><span>Use Space to pause. Arrow keys skip 5 seconds.</span><span>Shared by Siavash</span></div>
<p id="playerror" class="status error" role="alert"></p>
<?php elseif($videoId): ?><div class="panel narrow"><h1>Video unavailable</h1><p>Check the link with the person who shared this video.</p></div>
<?php elseif($owner): ?>
<div class="topline"><div><p class="eyebrow">Your video space</p><h1>Upload. Copy. Share.</h1></div><form method="post" action="?action=logout"><input type="hidden" name="csrf" value="<?=$csrf?>"><button>Sign out</button></form></div>
<section class="panel"><form id="upload"><label for="title" style="margin-top:0">Video title</label><input id="title" name="title" maxlength="240" placeholder="For example: HubSpot handover" required><label for="file">Video file</label><input id="file" type="file" accept="video/mp4,video/webm,.mp4,.webm" required><small>MP4 or WebM - Up to 2 GB</small><br><button class="primary" id="uploadButton">Upload video</button><progress id="progress" value="0" max="100" hidden></progress><div class="status" id="uploadStatus" role="status" aria-live="polite"></div></form></section>
<div class="list" id="list"><?php foreach($videos as $v): ?><article class="row"><div><h2><?=esc($v['title'])?></h2><small><?=gmdate('j M Y',$v['created'])?> - <?=number_format($v['size']/1048576,1)?> MB</small></div><div class="tools"><a class="button" href="?v=<?=esc($v['id'])?>" target="_blank" rel="noopener">View video</a><button data-copy="<?=$base?>?v=<?=esc($v['id'])?>">Copy link</button></div></article><?php endforeach; ?></div><p id="notice" role="status"></p>
<?php elseif($canSetup || $config): ?>
<section class="panel narrow"><p class="eyebrow">Owner access</p><h1><?=$canSetup?'Set your upload password':'Sign in to upload'?></h1><p><?=$canSetup?'Choose a password for your upload area. Clients can open their share links without signing in.':'Your videos and upload controls are available here.'?></p>
<?php if($error):?><p class="error" role="alert"><?=esc($error)?></p><?php endif;?>
<form method="post" action="?action=<?=$canSetup?'setup&amp;setup='.esc($setupKey):'login'?>"><input type="hidden" name="csrf" value="<?=$csrf?>"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="<?=$canSetup?'new-password':'current-password'?>" <?=$canSetup?'minlength="12"':''?> maxlength="200" required><button class="primary"><?=$canSetup?'Create upload access':'Sign in'?></button></form></section>
<?php else: ?><section class="panel narrow"><h1>Video walkthroughs</h1><p>Open the video link shared with you to watch a walkthrough.</p></section><?php endif;?>
<footer>Siavash Zahir - HubSpot, CRM &amp; automation</footer></main>
<script nonce="<?=$nonce?>">
const csrf=<?=json_encode($csrf)?>;
const notice=document.querySelector('#notice');
async function copyLink(value,button){const url=new URL(value,location.origin).href;try{await navigator.clipboard.writeText(url);if(notice)notice.textContent='Link copied';const old=button.textContent;button.textContent='Copied';setTimeout(()=>button.textContent=old,1800);}catch{prompt('Copy this video link:',url);}}
document.addEventListener('click',e=>{const button=e.target.closest('[data-copy]');if(button)copyLink(button.dataset.copy,button);});
const video=document.querySelector('#video');
if(video){
const player=document.querySelector('#player'),play=document.querySelector('#playPause'),center=document.querySelector('#centerPlay'),seek=document.querySelector('#seek'),time=document.querySelector('#time'),mute=document.querySelector('#mute'),volume=document.querySelector('#volume');
video.controls=false;document.querySelector('#playerControls').hidden=false;center.hidden=false;
const clock=t=>Number.isFinite(t)?Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'):'0:00';
function update(){const duration=video.duration||0;time.textContent=clock(video.currentTime)+' / '+clock(duration);seek.value=duration?video.currentTime/duration*100:0;seek.setAttribute('aria-valuetext',clock(video.currentTime)+' of '+clock(duration));seek.style.setProperty('--played',seek.value+'%');}
async function toggle(){try{if(video.paused)await video.play();else video.pause();}catch{document.querySelector('#playerror').textContent='Playback could not start. Please try again.';}}
play.addEventListener('click',toggle);center.addEventListener('click',toggle);video.addEventListener('click',toggle);
video.addEventListener('play',()=>{play.textContent='Pause';play.setAttribute('aria-label','Pause');center.hidden=true;});video.addEventListener('pause',()=>{play.textContent='Play';play.setAttribute('aria-label','Play');center.hidden=false;});
video.addEventListener('timeupdate',update);video.addEventListener('loadedmetadata',update);video.addEventListener('durationchange',update);
seek.addEventListener('input',()=>{if(Number.isFinite(video.duration))video.currentTime=Number(seek.value)/100*video.duration;update();});
document.querySelector('#backTen').addEventListener('click',()=>{video.currentTime=Math.max(0,video.currentTime-10);update();});
mute.addEventListener('click',()=>video.muted=!video.muted);volume.addEventListener('input',()=>{video.volume=Number(volume.value);video.muted=video.volume===0;});video.addEventListener('volumechange',()=>{mute.textContent=video.muted?'Muted':'Sound on';mute.setAttribute('aria-label',video.muted?'Unmute':'Mute');volume.value=video.muted?0:video.volume;});
document.querySelector('#speed').addEventListener('change',e=>video.playbackRate=Number(e.target.value));document.querySelector('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(player.requestFullscreen)await player.requestFullscreen();else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();}catch{}});
player.addEventListener('keydown',e=>{if(e.target.matches('input,select,button'))return;if(e.code==='Space'){e.preventDefault();toggle();}else if(e.code==='ArrowRight'){e.preventDefault();video.currentTime=Math.min(video.duration,video.currentTime+5);}else if(e.code==='ArrowLeft'){e.preventDefault();video.currentTime=Math.max(0,video.currentTime-5);}});
video.addEventListener('error',()=>document.querySelector('#playerror').textContent='This video could not be played. Try another browser or ask for an MP4 version.');update();}
const form=document.querySelector('#upload');let uploading=false;
if(form){const fileInput=document.querySelector('#file'),titleInput=document.querySelector('#title');fileInput.addEventListener('change',()=>{if(!titleInput.value&&fileInput.files[0])titleInput.value=fileInput.files[0].name.replace(/\.[^.]+$/,'');});
form.addEventListener('submit',async e=>{e.preventDefault();if(uploading)return;const file=fileInput.files[0];const status=document.querySelector('#uploadStatus'),button=document.querySelector('#uploadButton'),progress=document.querySelector('#progress');if(!file)return;if(!/\.(mp4|webm)$/i.test(file.name)||file.size>2147483648){status.textContent='Choose an MP4 or WebM video up to 2 GB.';return;}uploading=true;button.disabled=true;progress.hidden=false;progress.value=0;status.classList.remove('error');
try{async function api(action,body,extra=''){const response=await fetch('?action='+action+extra,{method:'POST',headers:{'X-CSRF-Token':csrf},body});const result=await response.json();if(!response.ok)throw Error(result.error||'Upload failed.');return result;}
const data=new FormData();data.set('title',titleInput.value);data.set('name',file.name);data.set('size',file.size);status.textContent='Starting upload...';const upload=await api('init',data);let index=0;
for(let offset=0;offset<file.size;offset+=upload.chunkSize){const chunk=file.slice(offset,offset+upload.chunkSize);let result;for(let attempt=0;attempt<3;attempt++){try{result=await api('chunk',chunk,'&id='+upload.id+'&index='+index);break;}catch(error){if(attempt===2)throw error;await new Promise(r=>setTimeout(r,1000*(attempt+1)));}}index=result.next;const percent=Math.round(Math.min(file.size,offset+chunk.size)/file.size*100);progress.value=percent;status.textContent='Uploading... '+percent+'%';}
status.textContent='Finishing your video...';const done=await api('finish',new FormData(),'&id='+upload.id);status.replaceChildren();const text=document.createTextNode('Ready to share. ');const view=document.createElement('a');view.href=done.url;view.target='_blank';view.rel='noopener';view.textContent='View video';const copy=document.createElement('button');copy.type='button';copy.dataset.copy=done.url;copy.textContent='Copy link';copy.style.marginLeft='12px';status.append(text,view,copy);progress.value=100;form.reset();
}catch(error){status.classList.add('error');status.textContent=error.message||'Upload failed. Please try again.';}finally{uploading=false;button.disabled=false;}});window.addEventListener('beforeunload',e=>{if(uploading){e.preventDefault();e.returnValue='';}});}
</script></body></html>

