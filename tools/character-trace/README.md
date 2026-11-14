# Character trace

How `media/characters/boy.svg` and `girl.svg` were made: a flat cartoon picture
on white paper becomes a transparent, scalable SVG for the TV films.

Needs `python -m pip install vtracer` (plus Pillow and numpy).

```sh
# 1. enlarge the picture 2x (smoother curves, freckles survive)
python -P -c "from PIL import Image; im=Image.open('girl.jpg'); im.resize((im.width*2, im.height*2), Image.LANCZOS).save('girl2x.png')"

# 2. make the paper transparent (flood from the border)
python -P tools/character-trace/mask.py girl2x.png girl2x-a.png

# 3. find white gaps the flood could not reach (between hair and face,
#    between an arm and the body); re-run mask.py with their seeds
python -P tools/character-trace/holes.py girl2x-a.png
python -P tools/character-trace/mask.py girl2x.png girl2x-a.png 864,1196 1422,1188 604,710 1628,726

# 4. trace, then crop + viewBox + relative paths
python -P -c "import vtracer; vtracer.convert_image_to_svg_py('girl2x-a.png','girl-t.svg','color','stacked','spline',8,7,8,60,4.0,10,45,1)"
python -P tools/character-trace/clean.py girl-t.svg media/characters/girl.svg 0 Girl
```

Gotchas:

- **VTracer options go in BY POSITION.** On Python 3.14, any keyword option
  (even `colormode='color'`) segfaults. The order is: colormode, hierarchical,
  mode, filter_speckle, color_precision, layer_difference, corner_threshold,
  length_threshold, max_iterations, splice_threshold, path_precision.
- `8,7,8` (speckle, colour precision, layer difference) is the setting that
  keeps skin and the pale hoodie apart. Coarser settings turned her hand grey.
- A picture that was ALREADY traced (the boy) carries a pale rim of
  half-blended shapes. Render it at 2x and run it through the same steps with
  `SAT=30 GROW=9` (a wider rim cut). Keep `LIGHT` at its default 232, because
  a lower value eats light-grey shoe soles.
- Check the result on a COLOURED background. On white you cannot see leftover
  paper.
