import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from .export import export
from .http import Client, now, write_json
from .sources import collect
from .transform import normalize


def main():
    parser = argparse.ArgumentParser(description='Local Agent employment evidence pipeline. No publication side effects.')
    parser.add_argument('command', choices=['collect', 'normalize', 'export', 'run'])
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2] / '.private/job-market/data')
    parser.add_argument('--sources', type=Path, default=Path(__file__).with_name('sources.json'))
    parser.add_argument('--taxonomy', type=Path, default=Path(__file__).with_name('taxonomy.json'))
    parser.add_argument('--run-id', default=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
    parser.add_argument('--source', action='append', help='Select one source id; repeat to select several')
    parser.add_argument('--start', default='2026-03-08')
    parser.add_argument('--end', default='2026-09-08', help='Exclusive endpoint in Asia/Shanghai calendar dates')
    parser.add_argument('--delay', type=float, default=1.2)
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,100}', args.run_id):
        parser.error('run-id must be a plain identifier')
    if args.delay < 1:
        parser.error('delay must be at least one second per host')
    config = json.loads(args.sources.read_text())
    taxonomy = json.loads(args.taxonomy.read_text())
    if args.source and set(args.source) - {s['id'] for s in config['sources']}:
        parser.error('unknown source id')
    if args.command in ('collect', 'run'):
        client = Client(args.root, args.run_id, delay=args.delay)
        path = client.run / 'run.json'
        if path.exists():
            if json.loads(path.read_text())['config'] != config:
                parser.error('source configuration changed: use a new run-id')
        else:
            write_json(path, {'run_id': args.run_id, 'started_at': now(), 'config': config,
                              'observation_start': args.start, 'observation_end_exclusive': args.end})
        outcomes = collect(client, config, args.source)
        write_json(client.run / 'completed.json', {'finished_at': now(), 'sources': len(outcomes)})
    if args.command in ('normalize', 'export', 'run'):
        jobs, sources, summary = normalize(args.root, taxonomy)
        print(json.dumps(summary, ensure_ascii=False))
        if args.command in ('export', 'run'):
            target, manifest = export(args.root, jobs, sources, summary, taxonomy, args.start, args.end)
            print(json.dumps({'output': str(target.resolve()), 'counts': manifest['counts'],
                              'publishable': manifest['quality']['publishable']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
