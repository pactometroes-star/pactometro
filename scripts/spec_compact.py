import sys, re
lines=[l.strip() for l in open(sys.argv[1],encoding='utf-8') if l.strip()]
out=[]; i=0
while i < len(lines):
    l=lines[i]
    if re.match(r'^\d+\.-\s', l):
        out.append('\n## '+l); i+=1; continue
    # pattern: start, end, type, len, desc
    if i+4 < len(lines) and re.fullmatch(r'\d+',lines[i]) and re.fullmatch(r'\d+',lines[i+1]) and lines[i+2] in ('Num.','Alf.') and re.fullmatch(r'\d+',lines[i+3]):
        out.append(f"{lines[i]:>4}-{lines[i+1]:<4} {lines[i+2]} {lines[i+3]:>3}  {lines[i+4][:130]}"); i+=5; continue
    i+=1
print('\n'.join(out))
