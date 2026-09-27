# Writes the small HTML page for each experiment (python3 shell.py id [id…])
import sys
TPL = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>{title}</title>
<link rel="stylesheet" href="meter-bridge/meter-bridge.css" />
<link rel="stylesheet" href="lab-engine/lab.css" />
<script type="importmap">
{{
  "imports": {{
    "three": "./lib/three/three.module.min.js",
    "three/addons/": "./lib/three/addons/"
  }}
}}
</script>
</head>
<body>
<noscript>This simulation needs JavaScript and WebGL.</noscript>
<script type="module">
import {{ runLab }} from './lab-engine/engine.js';
import spec from './labs/{id}.js';
runLab(spec);
</script>
</body>
</html>
'''
import re
for id in sys.argv[1:]:
    title = sys.argv[0]
    try:
        src = open(f'../labs/{id}.js').read()
        m = re.search(r"title:\s*'([^']+)'", src)
        title = m.group(1) if m else id
    except FileNotFoundError:
        title = id
    open(f'../{id}.html', 'w').write(TPL.format(id=id, title=title + ' — Virtual Lab'))
    print('wrote', id)
