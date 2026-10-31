import re,os,shutil
S='/home/claude/src'
js='\n'.join(open(f'{S}/js/{f}').read() for f in sorted(os.listdir(f'{S}/js')) if f.endswith('.js'))
css=open(f'{S}/style.css').read();body=open(f'{S}/body.html').read()
FONTS='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=Unbounded:wght@600;700&family=JetBrains+Mono:wght@500;600&display=swap">'
script='<script>\n(function(){\n'+js+'\n})();\n</script>\n'
head='''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Дневник зала</title>
<meta name="theme-color" content="#eceff3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0e1317" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Дневник зала">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
'''
standalone=head+FONTS+'\n<style>'+css+'</style>\n</head>\n<body>\n'+body+script+'</body>\n</html>\n'
open('/home/claude/dnevnik-zala/index.html','w').write(standalone)
open('/home/claude/dnevnik-zala-android/www/index.html','w').write(standalone)
art='<title>Дневник зала</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'+FONTS+'\n<style>'+css+'</style>\n'+body+script.replace('var IS_ARTIFACT = false;','var IS_ARTIFACT = true;')
assert 'IS_ARTIFACT = true' in art
open('/tmp/claude-0/-home-claude/e8a8e9bd-27a9-52db-99d5-3e269529e02d/scratchpad/trenlog.html','w').write(art)
open('/tmp/claude-0/-home-claude/e8a8e9bd-27a9-52db-99d5-3e269529e02d/scratchpad/app.js','w').write(js)
print('ok',len(standalone))
