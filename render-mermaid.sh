#!/usr/bin/env bash
set -euo pipefail

INPUT_MD="$1"
OUTPUT_DIR="/home/exoulster/.openclaw/workspace/mermaid-diagrams"

mkdir -p "$OUTPUT_DIR"

# Extract and render mermaid diagrams
awk '
BEGIN { in_mermaid=0; diagram_num=0; }
/^```mermaid/ {
    in_mermaid=1;
    diagram_num++;
    mermaid_file="'"$OUTPUT_DIR"'/diagram-" diagram_num ".mmd";
    next;
}
/^```/ && in_mermaid {
    in_mermaid=0;
    next;
}
in_mermaid {
    print > mermaid_file;
}
' "$INPUT_MD"

# Render each diagram
for mmd in "$OUTPUT_DIR"/*.mmd; do
    [ -f "$mmd" ] || continue
    base="${mmd%.mmd}"
    png="${base}.png"
    echo "Rendering $(basename "$mmd")..."
    mmdc -i "$mmd" -o "$png" -w 2400 -s 3 -b transparent 2>/dev/null || echo "Failed: $mmd"
done

echo "Done! Rendered diagrams in $OUTPUT_DIR"
