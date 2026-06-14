txt = open('frontend/src/components/Tradutor.jsx','r',encoding='utf-8').read()
# Fix em dash in JSX string
txt = txt.replace(
    "Tenta com Changana ou Portugues \u2014 mais suportados.",
    "Tenta com Changana ou Portugues - mais suportados."
)
open('frontend/src/components/Tradutor.jsx','w',encoding='utf-8').write(txt)
print('OK')
