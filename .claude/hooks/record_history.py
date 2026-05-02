#!/usr/bin/env python3
"""Stop hook: append last user command to .claude/history.md"""
import json
import os
import sys
from datetime import datetime


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}

    transcript_path = data.get('transcript_path', '')
    if not transcript_path or not os.path.exists(transcript_path):
        return

    last_user_text = None
    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except Exception:
                    continue
                if entry.get('type') != 'user':
                    continue
                msg = entry.get('message', {})
                content = msg.get('content', '')
                if isinstance(content, str):
                    text = content.strip()
                    if text and not text.startswith('This session is being continued'):
                        last_user_text = text
                elif isinstance(content, list):
                    for part in content:
                        if isinstance(part, dict) and part.get('type') == 'text':
                            text = part.get('text', '').strip()
                            if text and not text.startswith('This session is being continued'):
                                last_user_text = text
    except Exception:
        return

    if not last_user_text:
        return

    hook_dir = os.path.dirname(os.path.abspath(__file__))
    history_path = os.path.join(hook_dir, '..', 'history.md')
    history_path = os.path.normpath(history_path)

    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    record = f"- **{now}**: {last_user_text}\n"

    try:
        with open(history_path, 'a', encoding='utf-8') as f:
            f.write(record)
    except Exception:
        pass


if __name__ == '__main__':
    main()
