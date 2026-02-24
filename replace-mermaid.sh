#!/usr/bin/env bash
set -euo pipefail

INPUT_MD="$1"
OUTPUT_MD="$2"
DIAGRAM_DIR="/home/exoulster/.openclaw/workspace/mermaid-diagrams"

awk -v diagram_dir="$DIAGRAM_DIR" '
BEGIN { in_mermaid=0; diagram_num=0; }
/^```mermaid/ {
    in_mermaid=1;
    diagram_num++;
    next;
}
/^```/ && in_mermaid {
    in_mermaid=0;
    png_file=diagram_dir "/diagram-" diagram_num ".png";
    # Check if file exists
    cmd = "test -f \"" png_file "\" && echo yes || echo no";
    cmd | getline exists;
    close(cmd);
    if (exists == "yes") {
        print "![Diagram " diagram_num "](file://" png_file ")";
    } else {
        print "*[Diagram " diagram_num " failed to render]*";
    }
    print "";
    next;
}
!in_mermaid {
    print;
}
' "$INPUT_MD" > "$OUTPUT_MD"

echo "Created $OUTPUT_MD with embedded diagram images"
