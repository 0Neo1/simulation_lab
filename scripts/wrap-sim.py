# Wraps a simulation spec (JavaScript module code on stdin) into its page.
# Usage: python3 scripts/wrap-sim.py public/interactive-simulations/sims/x.html "Title" < spec.js
import sys
out, title = sys.argv[1], sys.argv[2]
body = sys.stdin.read()
open(out, 'w').write(f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{title}</title>
<link rel="stylesheet" href="../engine/concept.css">
<script type="importmap">{{"imports":{{"three":"../../simulations/lib/three/three.module.min.js","three/addons/":"../../simulations/lib/three/addons/"}}}}</script>
</head><body>
<script type="module">
{body.strip()}
</script>
</body></html>
''')
print('wrote', out)
